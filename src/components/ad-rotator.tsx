import { useEffect, useMemo, useState } from "react";
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
// Signature kept compatible with previous callers (second arg ignored).
export function useAdRotator(ads: ResolvedAd[], _intervalMs?: number): ResolvedAd {
  const pool: string[] = [];
  for (const a of ads) for (const img of a.images) pool.push(img);
  const video = ads.find((a) => a.video)?.video ?? null;
  return {
    ...FALLBACK_AD,
    images: pool,
    video,
  };
}

/**
 * Fullscreen rotating image backdrop (WeTransfer-style).
 * Pools every image from every active ad, shuffles, and cycles one every 10s.
 * Click anywhere → primlink.com.
 */
export function AdBackdrop({ ad }: { ad: ResolvedAd }) {
  const images = ad.images;


  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    if (images.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % images.length), 10_000);
    return () => clearInterval(id);
  }, [images.length]);

  const current = images[i] ?? null;

  return (
    <a
      href="https://primlink.com"
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
          className="absolute inset-0 h-full w-full object-cover animate-[ut_fade_900ms_ease-out_both]"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 75% 75%, rgba(239,68,68,0.45), transparent 60%), linear-gradient(135deg, #0a0303, #1a0707)",
          }}
        />
      )}
      <style>{`@keyframes ut_fade { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: scale(1); } }`}</style>
    </a>
  );
}
