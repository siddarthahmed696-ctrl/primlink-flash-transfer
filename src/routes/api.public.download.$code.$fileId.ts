import { createFileRoute } from "@tanstack/react-router";

type DownloadParams = {
  code: string;
  fileId: string;
};

function encodeContentDispositionFilename(fileName: string) {
  const safeName = fileName.replace(/[\r\n"]/g, "_");
  const asciiName = safeName.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(safeName).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encoded}`;
}

async function handleDownload(params: DownloadParams, request: Request, headOnly = false) {
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
      .createSignedUrl(row.storage_path, 600);
    if (signError || !signed?.signedUrl) {
      console.error("[download] sign error", signError);
      return new Response("Could not start download", { status: 500 });
    }

    const range = request.headers.get("range");
    const upstream = await fetch(signed.signedUrl, {
      headers: range ? { range } : undefined,
    });

    if (!upstream.ok && upstream.status !== 206) {
      console.error("[download] upstream error", upstream.status, await upstream.text().catch(() => ""));
      return new Response("Could not fetch file", { status: upstream.status === 404 ? 404 : 502 });
    }

    if (!range && !headOnly) {
      try {
        await supabaseAdmin.rpc("increment_download_count", { _code: params.code });
      } catch {}
    }

    const headers = new Headers();
    headers.set("Content-Disposition", encodeContentDispositionFilename(row.file_name));
    headers.set("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
    headers.set("Accept-Ranges", upstream.headers.get("accept-ranges") || "bytes");
    headers.set("Cache-Control", "no-store");

    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);

    return new Response(headOnly ? null : upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    console.error("[download] unhandled", err);
    return new Response("Download service error", { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/download/$code/$fileId")({
  server: {
    handlers: {
      GET: async ({ params, request }) => handleDownload(params, request),
      HEAD: async ({ params, request }) => handleDownload(params, request, true),
    },
  },
});
