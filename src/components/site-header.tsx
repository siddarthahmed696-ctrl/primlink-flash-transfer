import { Link } from "@tanstack/react-router";
import { UTransferLogo } from "./utransfer-logo";

export function SiteHeader() {
  const linkCls =
    "text-sm text-white/70 hover:text-white transition-colors";
  return (
    <header className="relative z-20">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-white drop-shadow">
          <UTransferLogo size={28} />
          UTransfer<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/blog" className={linkCls} activeProps={{ className: "text-white font-medium" }}>
            Blog
          </Link>
          <Link to="/legal" className={linkCls} activeProps={{ className: "text-white font-medium" }}>
            Legal
          </Link>
          <Link to="/privacy" className={linkCls} activeProps={{ className: "text-white font-medium" }}>
            Privacy
          </Link>
          <Link to="/policy" className={linkCls} activeProps={{ className: "text-white font-medium" }}>
            Policy
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-20">
      <div className="mx-auto max-w-7xl px-6 h-10 flex items-center justify-between text-xs text-white/60">
        <div>© {new Date().getFullYear()} UTransfer</div>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-white">Privacy</Link>
          <Link to="/policy" className="hover:text-white">Policy</Link>
          <Link to="/legal" className="hover:text-white">Legal</Link>
        </div>
      </div>
    </footer>
  );
}
