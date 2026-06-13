import { supabase } from "@/integrations/supabase/client";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const k = "ut_visitor_sid";
  let v = sessionStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    sessionStorage.setItem(k, v);
  }
  return v;
}

export function startVisitorHeartbeat() {
  if (typeof window === "undefined") return () => {};
  const session_id = getOrCreateSessionId();
  const ping = () =>
    supabase
      .from("visitors")
      .upsert(
        { session_id, path: window.location.pathname, last_seen: new Date().toISOString() },
        { onConflict: "session_id" },
      )
      .then(() => {});
  ping();
  const id = setInterval(ping, 20_000);
  const onVis = () => document.visibilityState === "visible" && ping();
  document.addEventListener("visibilitychange", onVis);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVis);
  };
}
