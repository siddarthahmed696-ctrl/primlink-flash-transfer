import { useEffect, useState } from "react";
import type { ResolvedAd } from "@/lib/ads";

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
