import { useEffect, useState } from "react";
import type { ResolvedAd } from "@/lib/ads";
import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps `ads` in sync with the latest active ads from the backend.
 * Refetches on mount, when the tab regains focus, when it becomes visible,
 * on a short fallback interval, and immediately when the ads table changes —
 * so admin edits propagate to deployed frontends without a redeploy.
 */
export function useLiveAds(getAds: () => Promise<ResolvedAd[]>): ResolvedAd[] {
  const [ads, setAds] = useState<ResolvedAd[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      getAds()
        .then((next) => {
          if (!cancelled) setAds(next);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 15_000);
    const ch = supabase
      .channel("public-site-ads-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_ads" }, load)
      .subscribe();
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
  return ads;
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

/**
 * Rotate through ads as discrete units. Each ad is shown for `intervalMs`
 * (default 30s). The active ad keeps its own link, images and video — so
 * edits made in /admin to any specific ad are reflected on the live site
 * the next time that ad comes up in the rotation.
 */
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

/**
 * Fullscreen ad backdrop. If the current ad has a video, it plays fullscreen
 * and the whole surface links to that ad's `link_url`. Otherwise the ad's
 * images crossfade as a slideshow.
 */
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
