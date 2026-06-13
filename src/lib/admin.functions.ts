import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "siddarthahmed696@gmail.com";
const ADMIN_PASSWORD = "Prime Drink";

/**
 * Idempotent bootstrap for the single allow-listed admin account.
 * Creates the auth user (email confirmed) on first call and ensures they
 * have the `admin` role. Safe to call from the login page on every failed
 * sign-in attempt for that email.
 */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    if (data.email.trim().toLowerCase() !== ADMIN_EMAIL) {
      return { ok: false as const, reason: "not_allowed" };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up existing user
    let userId: string | null = null;
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = list?.users.find(
      (u) => (u.email ?? "").toLowerCase() === ADMIN_EMAIL,
    );
    if (found) {
      userId = found.id;
      // Make sure the password matches the one shipped in chat.
      await supabaseAdmin.auth.admin.updateUserById(found.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      if (error || !created.user) {
        return { ok: false as const, reason: error?.message ?? "create_failed" };
      }
      userId = created.user.id;
    }

    if (userId) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }
    return { ok: true as const };
  });
