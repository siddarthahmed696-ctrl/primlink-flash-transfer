import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { UTransferLogo } from "./vmoveyou-logo";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const linkCls = "text-sm text-slate-700 hover:text-blue-600 transition-colors";
  const activeCls = "text-blue-600 font-semibold";
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
    <header className="relative z-30 bg-white border-b border-slate-200 shadow-sm">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 sm:flex sm:h-20 sm:justify-between sm:px-6">
        <Link to="/" aria-label="V Move You" className="flex min-w-0 items-center gap-2 overflow-visible">
          <UTransferLogo size={72} sizes="(max-width: 640px) 56px, 72px" className="h-14 w-14 shrink-0 sm:h-[72px] sm:w-[72px]" />
          <span className="truncate text-base sm:text-lg font-bold text-slate-900">V Move You</span>
        </Link>
        <div className="flex shrink-0 items-center">
          <nav className="hidden sm:flex items-center gap-6">{links}</nav>
          <button
            type="button"
            className="sm:hidden text-slate-800 p-2 -mr-2"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="sm:hidden border-t border-slate-200 bg-white">
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
