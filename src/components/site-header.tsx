import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { UTransferLogo } from "./vmoveyou-logo";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const linkCls = "text-sm text-white/70 hover:text-white transition-colors";
  const links = (
    <>
      <Link to="/blog" className={linkCls} activeProps={{ className: "text-white font-medium" }} onClick={() => setOpen(false)}>
        Blog
      </Link>
      <Link to="/history" className={linkCls} activeProps={{ className: "text-white font-medium" }} onClick={() => setOpen(false)}>
        History
      </Link>
      <Link to="/privacy" className={linkCls} activeProps={{ className: "text-white font-medium" }} onClick={() => setOpen(false)}>
        Privacy Policy
      </Link>
    </>
  );

  return (
    <header className="relative z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        <Link
          to="/"
          aria-label="V Move You"
          className="flex items-center"
        >
          <UTransferLogo size={80} className="drop-shadow-[0_8px_24px_rgba(37,99,235,0.45)]" />
        </Link>
        <div className="flex items-center">
          <nav className="hidden sm:flex items-center gap-5">{links}</nav>
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
        <div className="sm:hidden border-t border-white/10 bg-gradient-to-b from-black via-[#0a0a1a] to-blue-900/90 backdrop-blur">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3">{links}</nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:h-10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
        <div>© {new Date().getFullYear()} V Move You</div>
        <div className="flex flex-wrap gap-4">
          <Link to="/history" className="hover:text-white">History</Link>
          <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
