import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem("ut_cookies");
    if (!v) {
      const t = setTimeout(() => setShow(true), 2400);
      return () => clearTimeout(t);
    }
  }, []);

  const set = (v: "accepted" | "declined") => {
    localStorage.setItem("ut_cookies", v);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,640px)] animate-[ut_slide_400ms_ease-out_both]">
      <div className="rounded-2xl border border-border bg-background/90 backdrop-blur-xl shadow-card p-4 flex items-start gap-3">
        <div className="size-9 rounded-full bg-primary/15 grid place-items-center text-primary shrink-0">
          <Cookie className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">We use cookies</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            UTransfer uses cookies to keep your session, remember preferences and measure
            traffic. You can accept or decline non-essential cookies.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => set("accepted")}
              className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-glow transition"
            >
              Accept all
            </button>
            <button
              onClick={() => set("declined")}
              className="px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-surface transition"
            >
              Decline
            </button>
          </div>
        </div>
        <button
          aria-label="Close"
          onClick={() => set("declined")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <style>{`@keyframes ut_slide { from { opacity:0; transform: translate(-50%, 20px); } to { opacity:1; transform: translate(-50%, 0); } }`}</style>
    </div>
  );
}
