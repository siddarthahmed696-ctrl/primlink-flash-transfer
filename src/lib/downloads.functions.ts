import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side: issue a short-lived signed URL for a specific file in a
// transfer, only after validating the caller knows the share_code AND the
// file belongs to that transfer. Storage paths are never exposed to clients.
//
// Implementation notes:
// - Looks up storage_path via a SECURITY DEFINER RPC using the publishable
//   key (JWT-format), avoiding any issues with new-format secret keys on the
//   Data API.
// - Signs the URL by calling the Storage REST API directly with the service
//   role key.
export const getDownloadUrl = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        code: z.string().min(1).max(128),
        fileId: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const PUBLISHABLE_KEY =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SERVICE_KEY) {
      console.error("[downloads] Missing Supabase env vars");
      throw new Error("Download service is not configured");
    }

    // 1) Resolve storage path via RPC (anon publishable key, JWT format)
    const rpcResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_download_path`, {
      method: "POST",
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: `Bearer ${PUBLISHABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _code: data.code, _file_id: data.fileId }),
    });

    if (!rpcResp.ok) {
      const text = await rpcResp.text();
      console.error("[downloads] RPC failed", rpcResp.status, text);
      throw new Error("Lookup failed");
    }

    const rows = (await rpcResp.json()) as Array<{
      storage_path: string;
      file_name: string;
    }>;
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) throw new Error("File not found or link expired");

    // 2) Sign URL via Storage REST API (service role)
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

    if (!signResp.ok) {
      const text = await signResp.text();
      console.error("[downloads] Sign failed", signResp.status, text);
      throw new Error("Could not sign URL");
    }

    const signed = (await signResp.json()) as { signedURL?: string; signedUrl?: string };
    const signedPath = signed.signedURL || signed.signedUrl;
    if (!signedPath) throw new Error("Could not sign URL");

    const url = `${SUPABASE_URL}/storage/v1${signedPath}${
      signedPath.includes("?") ? "&" : "?"
    }download=${encodeURIComponent(row.file_name)}`;

    return { url, fileName: row.file_name };
  });
