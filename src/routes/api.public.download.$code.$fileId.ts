import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/download/$code/$fileId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const PUBLISHABLE_KEY =
          process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SERVICE_KEY) {
          return new Response("Download service is not configured", { status: 500 });
        }

        const rpcResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_download_path`, {
          method: "POST",
          headers: {
            apikey: PUBLISHABLE_KEY,
            Authorization: `Bearer ${PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ _code: params.code, _file_id: params.fileId }),
        });
        if (!rpcResp.ok) return new Response("Lookup failed", { status: 404 });

        const rows = (await rpcResp.json()) as Array<{ storage_path: string; file_name: string }>;
        const row = Array.isArray(rows) ? rows[0] : null;
        if (!row) return new Response("File not found or link expired", { status: 404 });

        const signResp = await fetch(
          `${SUPABASE_URL}/storage/v1/object/sign/transfers/${row.storage_path
            .split("/")
            .map(encodeURIComponent)
            .join("/")}`,
          {
            method: "POST",
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ expiresIn: 600 }),
          },
        );
        if (!signResp.ok) return new Response("Could not start download", { status: 500 });

        await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_download_count`, {
          method: "POST",
          headers: {
            apikey: PUBLISHABLE_KEY,
            Authorization: `Bearer ${PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ _code: params.code }),
        }).catch(() => {});

        const signed = (await signResp.json()) as { signedURL?: string; signedUrl?: string };
        const signedPath = signed.signedURL || signed.signedUrl;
        if (!signedPath) return new Response("Could not start download", { status: 500 });

        const redirectUrl = `${SUPABASE_URL}/storage/v1${signedPath}${
          signedPath.includes("?") ? "&" : "?"
        }download=${encodeURIComponent(row.file_name)}`;

        return Response.redirect(redirectUrl, 302);
      },
    },
  },
});