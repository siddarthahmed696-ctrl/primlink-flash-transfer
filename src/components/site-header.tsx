import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export function SiteHeader() {
  const linkCls =
    "text-sm text-muted-foreground hover:text-foreground transition-colors";
  return (
    <header className="relative z-20 border-b border-border/60 backdrop-blur bg-background/70">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
          <span className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground">
            <Zap className="size-4" />
          </span>
          UTransfer<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/blog" className={linkCls} activeProps={{ className: "text-foreground font-medium" }}>
            Blog
          </Link>
          <Link to="/legal" className={linkCls} activeProps={{ className: "text-foreground font-medium" }}>
            Legal
          </Link>
          <Link to="/privacy" className={linkCls} activeProps={{ className: "text-foreground font-medium" }}>
            Privacy
          </Link>
          <Link to="/policy" className={linkCls} activeProps={{ className: "text-foreground font-medium" }}>
            Policy
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 h-10 flex items-center justify-between text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} UTransfer</div>
        <div className="flex gap-4">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/policy" className="hover:text-foreground">Policy</Link>
          <Link to="/legal" className="hover:text-foreground">Legal</Link>
        </div>
      </div>
    </footer>
  );
}
