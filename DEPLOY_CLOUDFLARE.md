# Deploy to Cloudflare Pages

## Step 1 — Push code to GitHub
If you haven't already, push your code to a GitHub repository.

## Step 2 — Import to Cloudflare Pages
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select your repository.

## Step 3 — Build Settings
Configure the following build settings:
- **Framework preset**: `None` (or `Vite` but manually override the output)
- **Build command**: `bun run build` (or `npm run build`)
- **Build output directory**: `.output/public`
- **Root directory**: `/`

## Step 4 — Environment Variables
Go to **Settings → Environment variables** and add the following:

| Variable Name | Value |
|---|---|
| `NITRO_PRESET` | `cloudflare-pages` |
| `NODE_VERSION` | `20` (or higher) |
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Publishable Key |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase Project ID |
| `SUPABASE_URL` | same as VITE_SUPABASE_URL |
| `SUPABASE_PUBLISHABLE_KEY` | same as VITE_SUPABASE_PUBLISHABLE_KEY |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |
| `LOVABLE_API_KEY` | Your Lovable API Key |

## Step 5 — Compatibility Flags
1. Go to **Settings → Functions → Compatibility flags**.
2. Add `nodejs_compat` for both **Production** and **Preview**.
3. Set **Compatibility date** to at least `2024-11-01`.

## Step 6 — Deploy
Click **Save and Deploy**.

## Common Issues
- **Error: "The directory `.output/public` does not exist"**: Ensure your build command is running correctly and that you've set `NITRO_PRESET=cloudflare-pages`.
- **SSR Errors**: Ensure `nodejs_compat` is enabled.
- **Node Version**: If the build fails during `npm install`, ensure `NODE_VERSION` is set to `20`.
