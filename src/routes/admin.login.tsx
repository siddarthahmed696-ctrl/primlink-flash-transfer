import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapAdmin } from "@/lib/admin.functions";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin · V Move You" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("siddarthahmed696@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (roles?.some((r) => r.role === "admin")) nav({ to: "/admin" });
    });
  }, [nav]);

  async function signIn() {
    setBusy(true);
    try {
      let res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) {
        // Allow-listed bootstrap: server-side creates the user on first try.
        const boot = await bootstrapAdmin({ data: { email } });
        if (!boot.ok) {
          toast.error(res.error.message);
          return;
        }
        res = await supabase.auth.signInWithPassword({ email, password });
        if (res.error) {
          toast.error(res.error.message);
          return;
        }
      }
      nav({ to: "/admin" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6 space-y-4">
        <div className="flex items-center gap-2 text-white">
          <ShieldCheck className="size-5 text-primary" />
          <h1 className="font-display text-xl font-bold">Admin login</h1>
        </div>
        <p className="text-xs text-white/60">Private area. Authorized staff only.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && signIn()}
          placeholder="Password"
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <button
          onClick={signIn}
          disabled={busy || !email || !password}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Sign in
        </button>
        <Link to="/" className="block text-center text-xs text-white/50 hover:text-white">
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
