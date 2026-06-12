import { useEffect, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";

export type Ad = {
  id: string;
  title: string;
  highlight: string;
  subtitle: string;
  cta: string;
  accent: string; // hex / oklch usable in colors
  bg: string; // css background value
};

export const ADS: Ad[] = [
  {
    id: "primlink-core",
    title: "Build, ship and",
    highlight: "grow faster",
    subtitle:
      "The all-in-one platform behind UTransfer. Discover tools, apps and services trusted by makers worldwide.",
    cta: "Explore Primlink",
    accent: "#ef4444",
    bg: "radial-gradient(circle at 20% 20%, rgba(239,68,68,0.55), transparent 55%), radial-gradient(circle at 80% 80%, rgba(120,20,20,0.7), transparent 60%), linear-gradient(135deg, #1a0707, #0a0303)",
  },
  {
    id: "primlink-cloud",
    title: "Scale your apps with",
    highlight: "Primlink Cloud",
    subtitle:
      "Deploy in seconds, edge-cached worldwide. The same infrastructure that powers UTransfer's 10 GB transfers.",
    cta: "Try Primlink Cloud",
    accent: "#3b82f6",
    bg: "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.55), transparent 55%), radial-gradient(circle at 75% 75%, rgba(17,24,90,0.85), transparent 60%), linear-gradient(135deg, #050a1a, #02040d)",
  },
  {
    id: "primlink-studio",
    title: "Design beautifully with",
    highlight: "Primlink Studio",
    subtitle:
      "AI-assisted design that ships pixel-perfect interfaces. Built for teams, loved by founders.",
    cta: "Open Primlink Studio",
    accent: "#a855f7",
    bg: "radial-gradient(circle at 25% 25%, rgba(168,85,247,0.5), transparent 55%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.55), transparent 60%), linear-gradient(135deg, #150821, #07030d)",
  },
  {
    id: "primlink-ai",
    title: "Automate work with",
    highlight: "Primlink AI",
    subtitle:
      "Generative agents that move data, write code and handle support — all wired into your stack.",
    cta: "Meet Primlink AI",
    accent: "#10b981",
    bg: "radial-gradient(circle at 25% 30%, rgba(16,185,129,0.5), transparent 55%), radial-gradient(circle at 78% 78%, rgba(6,95,70,0.7), transparent 60%), linear-gradient(135deg, #051a12, #02080a)",
  },
];

const PRIMLINK_URL = "https://primlink.com";

export function useAdRotator(intervalMs = 9000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ADS.length), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return ADS[index];
}

export function AdBackdrop({ ad }: { ad: Ad }) {
  return (
    <a
      href={PRIMLINK_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${PRIMLINK_URL}`}
      className="group fixed inset-0 z-0 block cursor-pointer overflow-hidden"
    >
      {ADS.map((a) => (
        <div
          key={a.id}
          className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
          style={{ background: a.bg, opacity: a.id === ad.id ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-grid opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      {/* Floating ad copy — center-right of the screen */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
        <div className="max-w-2xl pr-[6vw] pl-6 text-right">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium mb-5"
            style={{
              borderColor: `${ad.accent}66`,
              background: `${ad.accent}1a`,
              color: ad.accent,
            }}
          >
            <Sparkles className="size-3" /> Sponsored — Powered by Primlink
          </div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-white drop-shadow-lg">
            {ad.title}{" "}
            <span style={{ color: ad.accent }}>{ad.highlight}</span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl ml-auto">
            {ad.subtitle}
          </p>
          <span
            className="mt-7 inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-transform group-hover:scale-[1.03]"
            style={{ background: ad.accent, color: "#fff", boxShadow: `0 10px 40px -10px ${ad.accent}` }}
          >
            {ad.cta} <ExternalLink className="size-4" />
          </span>
          <div className="mt-4 text-[11px] text-white/60">
            Click anywhere to visit primlink.com
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-6 inline-flex items-center gap-1 text-xs text-white/70">
        primlink.com <ExternalLink className="size-3" />
      </div>
    </a>
  );
}
