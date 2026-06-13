## Goal
Restrict UTransfer to a red/black theme with English-only copy, and add a private admin panel that controls the fullscreen ads (images + optional video) rotating on the home page, plus a live visitor counter.

## Changes

### 1. Theme & copy (frontend)
- Remove blue / purple / green ads from `ad-rotator.tsx`. All ad backdrops use only red + black gradients.
- Remove any Urdu text. Headings, taglines, buttons, FAQ, blog, footer stay English.
- The send-widget accent stays red (no per-ad accent switching).

### 2. Database (new migration)
- `site_ads` table: `id`, `heading`, `tagline`, `link_url`, `image_urls text[]` (3–5), `video_url text` (nullable), `is_active bool`, `sort_order int`, `created_at`. RLS: anyone can SELECT active ads; only admins INSERT/UPDATE/DELETE.
- `app_role` enum + `user_roles` table + `has_role()` SECURITY DEFINER function (standard pattern).
- `visitors` table: `id`, `session_id`, `last_seen` — public INSERT/UPDATE keyed by session_id; admin SELECT. Realtime enabled.
- New storage bucket `ads` (public) for image/video uploads. Policies: public read; admin write.

### 3. Admin account
- Sign up `siddarthahmed696@gmail.com` with password `Prime Drink` via a seed migration (`auth.users` insert through `supabase_admin` helpers is not allowed in SQL; instead use the `users--create_user` route via insert tool with `auth.users` is forbidden). Approach: provide a one-time "claim admin" server function — first time the exact email signs up, grant admin role. Document credentials in chat.
- Actually simpler: provide an `/admin/login` page that calls `supabase.auth.signInWithPassword`. Add a server function `bootstrapAdmin` (no auth needed but checks the email matches a hard-coded allowlist) that calls `supabaseAdmin.auth.admin.createUser` + inserts an `admin` role row. Called automatically from the login page when sign-in fails with "Invalid credentials".

### 4. Admin panel (`/admin` under `_authenticated`)
- Route gate: must be signed in AND have `admin` role; else redirect to `/admin/login`.
- Tabs / sections:
  - **Live visitors**: count of `visitors` rows with `last_seen` in last 60 s, updated via realtime subscription.
  - **Ads manager**: list existing ads, create new ad form with fields: heading, tagline, link URL, 3–5 images (drag/drop), optional 1 video. Toggle active. Delete.
- Uploads go to `ads` bucket via authenticated client.

### 5. Home page
- Replace the hard-coded `ADS` array with live data from `site_ads` (public server fn → returns active ads ordered by `sort_order`).
- Each ad renders fullscreen: if `video_url` present → `<video autoplay muted loop playsinline>` covers the viewport; else cycles its `image_urls` as a slideshow inside the same slot.
- Overlay shows `heading` + `tagline` + CTA button. The whole backdrop is an `<a href={link_url} target="_blank">`, so any click on the ad opens that URL (not primlink.com unless the admin enters it).
- Rotation: 30 s between ads.
- Visitor heartbeat: on mount, generate sessionId and POST to a public server fn that upserts `{ session_id, last_seen: now() }` every 20 s.

### 6. Files
- `supabase/migrations/<ts>_admin_ads_visitors.sql` — enum, tables, RLS, grants, storage bucket + policies, publication add.
- `src/lib/ads.functions.ts` — `listActiveAds` (public), `saveAd`, `deleteAd` (admin-only), `bootstrapAdmin` (allowlist email only).
- `src/lib/visitors.functions.ts` — `heartbeat` (public), counted client-side via realtime.
- `src/routes/admin/login.tsx` — sign-in form.
- `src/routes/_authenticated/admin.tsx` — admin dashboard.
- Update `src/components/ad-rotator.tsx` → data-driven, red/black only, video support.
- Update `src/routes/index.tsx` → use live ads + heartbeat.

## Notes
- Storing the admin password in chat history is insecure; using it as the initial password is fine and the user can change it later from the admin panel (future enhancement).
- All RLS + GRANTs included per project rules.

## Confirm
Reply "go" and I'll implement.