import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { UTransferLogo } from "./vmoveyou-logo";

function BouncingBrand() {
  const [step, setStep] = useState(0);
  // 0: nothing, 1: V, 2: V Move, 3: V Move You, 4: combined bounce out
  useEffect(() => {
    const seq = [600, 600, 600, 1400];
    const t = setTimeout(() => setStep((s) => (s + 1) % 4), seq[step]);
    return () => clearTimeout(t);
  }, [step]);

  const wordCls = "inline-block animate-[ut_bounce_600ms_ease-out_both]";
  return (
    <div className="pointer-events-none select-none flex items-baseline gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
      {step >= 0 && (
        <span key={`v-${step}`} className={`${wordCls} text-blue-500 drop-shadow-[0_2px_6px_rgba(59,130,246,0.5)] [-webkit-text-stroke:1.5px_white]`}>V</span>
      )}
      {step >= 1 && (
        <span key={`m-${step}`} className={`${wordCls} text-black [-webkit-text-stroke:1.5px_white]`}>Move</span>
      )}
      {step >= 2 && (
        <span key={`y-${step}`} className={`${wordCls} text-blue-500 drop-shadow-[0_2px_6px_rgba(59,130,246,0.5)] [-webkit-text-stroke:1.5px_white]`}>You</span>
      )}
      <style>{`
        @keyframes ut_bounce {
          0% { transform: translateY(-40px) scale(.6); opacity: 0; }
          50% { transform: translateY(8px) scale(1.1); opacity: 1; }
          75% { transform: translateY(-4px) scale(.97); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes ut_shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          15% { transform: translate(-3px, -1px) rotate(-2deg); }
          30% { transform: translate(3px, 1px) rotate(2deg); }
          45% { transform: translate(-3px, 1px) rotate(-1deg); }
          60% { transform: translate(3px, -1px) rotate(1deg); }
          75% { transform: translate(-1px, 0) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const linkCls = "text-sm font-bold text-white hover:text-blue-300 transition-colors";
  const activeCls = "text-blue-300";
  const links = (
    <>
      <Link to="/blog" className={linkCls} activeProps={{ className: activeCls }} onClick={() => setOpen(false)}>
        Blog
      </Link>
      <Link to="/history" className={linkCls} activeProps={{ className: activeCls }} onClick={() => setOpen(false)}>
        History
      </Link>
      <Link to="/privacy" className={linkCls} activeProps={{ className: activeCls }} onClick={() => setOpen(false)}>
        Privacy Policy
      </Link>
    </>
  );

  return (
    <header className="relative z-30 bg-transparent">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <BouncingBrand />
      </div>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:h-20 sm:px-6">
        <Link to="/" aria-label="V Move You" className="flex min-w-0 items-center overflow-visible relative z-10">
          <span
            className="inline-block"
            style={{
              animation: "ut_shake 2.5s ease-in-out infinite",
              filter: "drop-shadow(0 -1.5px 0 white) drop-shadow(0 1.5px 0 white) drop-shadow(-1.5px 0 0 white) drop-shadow(1.5px 0 0 white)",
            }}
          >
            <UTransferLogo size={64} sizes="(max-width: 640px) 48px, 64px" className="h-12 w-12 shrink-0 sm:h-16 sm:w-16" />
          </span>
        </Link>

        <div />

        <div className="flex shrink-0 items-center justify-end relative z-10">
          <nav className="hidden sm:flex items-center gap-6">{links}</nav>
          <button
            type="button"
            className="sm:hidden text-white p-2 -mr-2"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="sm:hidden border-t border-white/10 bg-black/40 backdrop-blur">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3">{links}</nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:h-10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70 font-semibold">
        <div>© {new Date().getFullYear()} V Move You</div>
        <div className="flex flex-wrap gap-4">
          <Link to="/history" className="hover:text-white">History</Link>
          <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
