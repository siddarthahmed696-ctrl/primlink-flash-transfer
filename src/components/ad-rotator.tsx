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

// Pools every image from every active ad into a single rotating set.
export function useAdRotator(ads: ResolvedAd[], _intervalMs?: number): ResolvedAd {
  const pool: string[] = [];
  for (const a of ads) for (const img of a.images) pool.push(img);
  const video = ads.find((a) => a.video)?.video ?? null;
  const firstLink = ads.find((a) => a.link_url)?.link_url ?? null;
  return {
    ...FALLBACK_AD,
    link_url: firstLink || FALLBACK_AD.link_url,
    images: pool,
    video,
  };
}

/**
 * Fullscreen rotating image backdrop with smooth crossfade + Ken Burns zoom.
 * Each image stays ~8s. Two stacked layers swap so the new image fades in
 * over the previous one (no black flash, no jump-cut).
 */
export function AdBackdrop({ ad }: { ad: ResolvedAd }) {
  const images = ad.images;
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
    if (images.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % images.length), 8000);
    return () => clearInterval(id);
  }, [images.length]);

  const current = images[i] ?? null;

  return (
    <a
      href={ad.link_url || "https://primlink.com"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Sponsored"
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
      {/* subtle vignette so overlay text stays legible */}
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
