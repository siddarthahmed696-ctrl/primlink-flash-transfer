import { useEffect, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import type { ResolvedAd } from "@/lib/ads";

const ACCENT = "#ef4444"; // brand red

/** Fallback shown when no admin ads exist yet. */
export const FALLBACK_AD: ResolvedAd = {
  id: "fallback",
  heading: "Send big files fast",
  tagline: "Up to 10 GB free — no signup, worldwide delivery.",
  link_url: "https://primlink.com",
  is_active: true,
  sort_order: 0,
  images: [],
  video: null,
};

export function useAdRotator(ads: ResolvedAd[], intervalMs = 30_000) {
  const safe = ads.length ? ads : [FALLBACK_AD];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (safe.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % safe.length), intervalMs);
    return () => clearInterval(id);
  }, [safe.length, intervalMs]);
  return safe[index % safe.length];
}

/** Cycles through an ad's images every 4s while it's the active ad. */
function useImageCycler(images: string[]) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
    if (images.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % images.length), 4_000);
    return () => clearInterval(id);
  }, [images.join("|")]);
  return images[i] ?? null;
}

export function AdBackdrop({ ad }: { ad: ResolvedAd }) {
  const currentImage = useImageCycler(ad.images);
  const href = ad.link_url || "https://primlink.com";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ad.heading}
      className="group fixed inset-0 z-0 block cursor-pointer overflow-hidden"
    >
      {/* Red/black base layer */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 75% 75%, rgba(239,68,68,0.45), transparent 60%), radial-gradient(circle at 20% 20%, rgba(120,20,20,0.6), transparent 55%), linear-gradient(135deg, #0a0303, #1a0707)",
        }}
      />

      {/* Media layer — video wins over image */}
      {ad.video ? (
        <video
          key={ad.video}
          src={ad.video}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      ) : currentImage ? (
        <img
          key={currentImage}
          src={currentImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-90 animate-[ut_fade_900ms_ease-out_both]"
        />
      ) : null}

      {/* Dim + red wash to keep red/black mood */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-red-950/70" />
      <div className="absolute inset-0 bg-grid opacity-15 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {/* Floating ad copy — right side */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
        <div className="max-w-2xl pr-[6vw] pl-6 text-right">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-5"
            style={{
              borderColor: `${ACCENT}66`,
              background: `${ACCENT}1a`,
              color: ACCENT,
            }}
          >
            <Sparkles className="size-3" /> Powered by Primlink
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-white drop-shadow-lg">
            {ad.heading}
          </h2>
          {ad.tagline && (
            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-xl ml-auto">
              {ad.tagline}
            </p>
          )}
          <span
            className="mt-7 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-transform group-hover:scale-[1.03]"
            style={{ background: ACCENT, color: "#fff", boxShadow: `0 10px 40px -10px ${ACCENT}` }}
          >
            Visit sponsor <ExternalLink className="size-4" />
          </span>
          <div className="mt-4 text-[11px] text-white/60">
            Click anywhere to open the sponsor link
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-6 inline-flex items-center gap-1 text-xs text-white/70">
        Sponsored <ExternalLink className="size-3" />
      </div>

      <style>{`@keyframes ut_fade { from { opacity: 0; transform: scale(1.04); } to { opacity: .9; transform: scale(1); } }`}</style>
    </a>
  );
}
