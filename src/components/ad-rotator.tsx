import { useEffect, useMemo, useState } from "react";
import type { ResolvedAd } from "@/lib/ads";
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
        .then((next) => {
          if (cancelled) return;
          setAds(next);
          setLastSyncedAt(new Date());
          setLastError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          setLastError(err?.message ?? String(err));
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
      className="fixed inset-0 z-0 block cursor-pointer overflow-hidden bg-black"
    >
      {ad.video ? (
        <video
          key={ad.video}
          src={ad.video}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : current ? (
        <img
          key={current}
          src={current}
          alt=""
          className="absolute inset-0 h-full w-full object-cover ut-kenburns"
        />
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      <style>{`
        @keyframes ut_kenburns {
          0%   { opacity: 0; transform: scale(1.08) translate3d(0,0,0); filter: blur(8px); }
          12%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: scale(1.0) translate3d(-1%, -1%, 0); filter: blur(0); }
        }
        .ut-kenburns { animation: ut_kenburns 8s ease-out both; will-change: transform, opacity, filter; }
      `}</style>
    </a>
  );
}
