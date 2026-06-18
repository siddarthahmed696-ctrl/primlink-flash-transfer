import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ACCENT = "#2563eb";

export function AuthModal({
  open,
  defaultEmail,
  onClose,
  onSuccess,
}: {
  open: boolean;
  defaultEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      return toast.error("Enter email and a password (6+ chars)");
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        // Upgrade an anonymous session (used for uploads) to a real account
        // if one exists, otherwise create a fresh user.
        const { data: u } = await supabase.auth.getUser();
        if (u.user?.is_anonymous) {
          const { error: upErr } = await supabase.auth.updateUser({ email, password });
          if (upErr) throw upErr;
        } else {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
          if (error) throw error;
        }
        const { data: s } = await supabase.auth.getSession();
        if (!s.session) {
          // Auto-confirm is enabled, sign in directly.
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
        toast.success("Account created");
      } else {
        // Sign out anonymous session first so signIn replaces it cleanly
        const { data: u } = await supabase.auth.getUser();
        if (u.user?.is_anonymous) await supabase.auth.signOut();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-zinc-950/90 p-5 space-y-3 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        <h2 className="font-display text-xl font-bold text-white">
          {mode === "signup" ? "Create your account" : "Sign in"}
        </h2>
        <p className="text-xs text-white/60">
          Sending files by email needs an account. Sharing a link only does not.
        </p>

        <input
          type="email"
          autoComplete="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-4 py-2.5 rounded-full disabled:opacity-50"
          style={{ background: ACCENT, boxShadow: `0 10px 30px -10px ${ACCENT}` }}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {mode === "signup" ? "Sign up & send" : "Sign in & send"}
        </button>

        <div className="text-center text-xs text-white/60">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="text-white underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-white underline"
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
