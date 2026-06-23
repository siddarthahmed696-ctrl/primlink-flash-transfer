import { useEffect, useMemo, useState } from "react";
import { fetchActiveAds, type ResolvedAd } from "@/lib/ads";
import { supabase } from "@/integrations/supabase/client";

export type AdsSyncStatus = {
  lastSyncedAt: Date | null;
  lastError: string | null;
  channelStatus: "idle" | "connecting" | "subscribed" | "error" | "closed";
  adsCount: number;
};

export type LiveAds = {
  ads: ResolvedAd[];
  status: AdsSyncStatus;
};

/**
 * Keeps `ads` in sync with the latest active ads from the backend.
 * Refetches on mount, focus, visibility, on a short fallback interval,
 * and immediately when the ads table changes via realtime.
 */
export function useLiveAds(getAds: () => Promise<ResolvedAd[]>): LiveAds {
  const [ads, setAds] = useState<ResolvedAd[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [channelStatus, setChannelStatus] = useState<AdsSyncStatus["channelStatus"]>("idle");

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getAds()
        .then(async (next) => {
          if (next.length) return next;
          return fetchActiveAds();
        })
        .then((next) => {
          if (cancelled) return;
          setAds(next);
          setLastSyncedAt(new Date());
          setLastError(null);
        })
        .catch(async (err: unknown) => {
          if (cancelled) return;
          try {
            const next = await fetchActiveAds();
            if (cancelled) return;
            setAds(next);
            setLastSyncedAt(new Date());
            const message = err instanceof Error ? err.message : String(err);
            setLastError(next.length ? null : message);
          } catch (fallbackErr: unknown) {
            if (cancelled) return;
            const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : null;
            const message = err instanceof Error ? err.message : String(err);
            setLastError(fallbackMessage ?? message);
          }
        });
    };
    load();
    const id = setInterval(load, 15_000);
    setChannelStatus("connecting");
    const ch = supabase
      .channel("public-site-ads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_ads" }, load)
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") setChannelStatus("subscribed");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setChannelStatus("error");
        else if (status === "CLOSED") setChannelStatus("closed");
      });
    const onFocus = () => load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      supabase.removeChannel(ch);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [getAds]);

  const status = useMemo<AdsSyncStatus>(
    () => ({ lastSyncedAt, lastError, channelStatus, adsCount: ads.length }),
    [lastSyncedAt, lastError, channelStatus, ads.length],
  );

  return { ads, status };
}

function formatAgo(d: Date | null): string {
  if (!d) return "never";
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/**
 * Compact ads-sync indicator. Shows subscription health and last-synced time.
 * Safe to render on both admin and the public site.
 */
export function AdsSyncStatusIndicator({
  status,
  className,
  variant = "chip",
}: {
  status: AdsSyncStatus;
  className?: string;
  variant?: "chip" | "inline";
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const healthy = status.channelStatus === "subscribed" && !status.lastError;
  const connecting = status.channelStatus === "connecting" || status.channelStatus === "idle";
  const color = status.lastError || status.channelStatus === "error"
    ? "bg-red-500"
    : healthy
      ? "bg-emerald-500"
      : connecting
        ? "bg-amber-400"
        : "bg-white/40";
  const label = status.lastError
    ? "Sync error"
    : healthy
      ? "Ads live"
      : connecting
        ? "Connecting"
        : status.channelStatus === "closed"
          ? "Reconnecting"
          : "Offline";

  const title = [
    `Channel: ${status.channelStatus}`,
    `Ads loaded: ${status.adsCount}`,
    `Last synced: ${status.lastSyncedAt ? status.lastSyncedAt.toLocaleTimeString() : "never"}`,
    status.lastError ? `Error: ${status.lastError}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const base =
    variant === "chip"
      ? "inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 backdrop-blur px-2.5 py-1 text-[11px] text-white/85"
      : "inline-flex items-center gap-2 text-[11px] text-white/80";

  return (
    <div className={`${base} ${className ?? ""}`} title={title} aria-label={title}>
      <span className="relative flex size-2">
        {healthy && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${color}`} />
        )}
        <span className={`relative inline-flex size-2 rounded-full ${color}`} />
      </span>
      <span className="font-medium">{label}</span>
      <span className="text-white/55">· synced {formatAgo(status.lastSyncedAt)}</span>
    </div>
  );
}

export const FALLBACK_AD: ResolvedAd = {
  id: "fallback",
  heading: "",
  tagline: "",
  link_url: "https://primlink.com",
  is_active: true,
  sort_order: 0,
  images: [],
  video: null,
};

export function useAdRotator(ads: ResolvedAd[], intervalMs = 30_000): ResolvedAd {
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
    if (ads.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % ads.length), intervalMs);
    return () => clearInterval(id);
  }, [ads.length, intervalMs]);

  if (!ads.length) return FALLBACK_AD;
  return ads[i % ads.length];
}

export function AdBackdrop({ ad }: { ad: ResolvedAd }) {
  const images = ad.images;
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
    if (images.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % images.length), 8000);
    return () => clearInterval(id);
  }, [images.length, ad.id]);

  const current = images[i] ?? null;

  return (
    <a
      href={ad.link_url || "https://primlink.com"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ad.heading || "Sponsored"}
      className="fixed inset-0 z-0 block cursor-pointer overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 40%, #1e3a8a 0%, #0c1a3a 45%, #05060f 100%)",
      }}
    >
      {/* floating tilted brand tiles (decorative) */}
      <span aria-hidden className="ut-tile ut-tile-1" />
      <span aria-hidden className="ut-tile ut-tile-2" />
      <span aria-hidden className="ut-tile ut-tile-3" />
      <span aria-hidden className="ut-tile ut-tile-4" />
      <span aria-hidden className="ut-tile ut-tile-5" />

      {ad.video ? (
        <video
          key={ad.video}
          src={ad.video}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : current ? (
        <img
          key={current}
          src={current}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

      <style>{`
        @keyframes ut_float {
          0%, 100% { transform: translate3d(0,0,0) rotate(var(--r, 0deg)); }
          50%      { transform: translate3d(0,-14px,0) rotate(calc(var(--r, 0deg) + 2deg)); }
        }
        .ut-tile {
          position: absolute;
          display: block;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(37,99,235,0.55), rgba(15,23,42,0.85));
          box-shadow:
            0 30px 60px -20px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.12);
          border: 1px solid rgba(96,165,250,0.25);
          opacity: 0.85;
          animation: ut_float 9s ease-in-out infinite;
          will-change: transform;
        }
        .ut-tile-1 { width: 130px; height: 130px; top: 18%;  left: 6%;  --r: -14deg; animation-delay: 0s;   }
        .ut-tile-2 { width: 90px;  height: 90px;  top: 58%;  left: 10%; --r: 10deg;  animation-delay: 1.2s; opacity: .75; }
        .ut-tile-3 { width: 110px; height: 110px; top: 22%;  right: 8%; --r: 12deg;  animation-delay: 0.6s; }
        .ut-tile-4 { width: 95px;  height: 95px;  top: 62%;  right: 6%; --r: -8deg;  animation-delay: 1.8s; }
        .ut-tile-5 { width: 70px;  height: 70px;  top: 80%;  right: 18%; --r: 18deg; animation-delay: 2.4s; opacity: .7; }
        @media (max-width: 640px) {
          .ut-tile-1 { width: 80px; height: 80px; }
          .ut-tile-2, .ut-tile-4 { width: 60px; height: 60px; }
          .ut-tile-3 { width: 70px; height: 70px; }
          .ut-tile-5 { display: none; }
        }
      `}</style>
    </a>
  );
}

