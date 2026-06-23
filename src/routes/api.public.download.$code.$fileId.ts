import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/download/$code/$fileId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: rows, error: rpcError } = await supabaseAdmin.rpc("get_download_path", {
            _code: params.code,
            _file_id: params.fileId,
          });
          if (rpcError) {
            console.error("[download] rpc error", rpcError);
            return new Response("Lookup failed", { status: 404 });
          }
          const row = Array.isArray(rows) ? rows[0] : null;
          if (!row) return new Response("File not found or link expired", { status: 404 });

          const { data: signed, error: signError } = await supabaseAdmin.storage
            .from("transfers")
            .createSignedUrl(row.storage_path, 600, { download: row.file_name });
          if (signError || !signed?.signedUrl) {
            console.error("[download] sign error", signError);
            return new Response("Could not start download", { status: 500 });
          }

          await supabaseAdmin
            .rpc("increment_download_count", { _code: params.code })
            .then(() => {})
            .catch(() => {});

          return Response.redirect(signed.signedUrl, 302);
        } catch (err) {
          console.error("[download] unhandled", err);
          return new Response("Download service error", { status: 500 });
        }
      },
    },
  },
});
