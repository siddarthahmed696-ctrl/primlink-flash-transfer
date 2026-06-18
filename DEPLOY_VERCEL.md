# Deploy to Vercel (GitHub → 1-click)

## Step 1 — Push code to GitHub
In Lovable: **Plus (+) button → GitHub → Connect to GitHub** → authorize with `siddarthahmed696@gmail.com` → **Create Repository**.

## Step 2 — Import to Vercel
1. Go to https://vercel.com → Sign in with the same GitHub account.
2. **Add New → Project** → select your repo → **Import**.
3. Framework Preset: **Other** (vercel.json handles config).
4. Build Command: `bun run build` (already set in vercel.json).
5. Output Directory: leave blank (Nitro writes to `.vercel/output`).

## Step 3 — Environment Variables
In Vercel project → **Settings → Environment Variables**, add ALL of these
(values are in your Lovable Cloud — `.env` file in the project):

| Name | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Lovable `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Lovable `.env` |
| `VITE_SUPABASE_PROJECT_ID` | Lovable `.env` |
| `SUPABASE_URL` | same as VITE_SUPABASE_URL |
| `SUPABASE_PUBLISHABLE_KEY` | same as VITE_SUPABASE_PUBLISHABLE_KEY |
| `SUPABASE_SERVICE_ROLE_KEY` | Lovable Cloud → Backend (server-only) |
| `LOVABLE_API_KEY` | Lovable Cloud → Backend (server-only) |
| `NITRO_PRESET` | `vercel` (already in vercel.json) |

Apply to **Production, Preview, Development**.

## Step 4 — Deploy
Click **Deploy**. Done. Har GitHub push pe auto-deploy hoga (main → production, branches → preview URL).

## Notes
- `vercel.json` sets `NITRO_PRESET=vercel` so TanStack Start builds for Vercel serverless instead of Cloudflare.
- Server functions (`createServerFn`) and Supabase auth will work out of the box.
- Custom domain: Vercel project → Settings → Domains.
