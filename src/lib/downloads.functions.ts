import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Server-side: issue a short-lived signed URL for a specific file in a
// transfer, only after validating the caller knows the share_code AND the
// file belongs to that transfer. Storage paths are never exposed to clients.
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: transfer, error: tErr } = await supabaseAdmin
      .from("transfers")
      .select("id, expires_at")
      .eq("share_code", data.code)
      .maybeSingle();
    if (tErr) throw new Error("Lookup failed");
    if (!transfer) throw new Error("Transfer not found");
    if (new Date(transfer.expires_at).getTime() < Date.now()) {
      throw new Error("Transfer expired");
    }

    const { data: file, error: fErr } = await supabaseAdmin
      .from("transfer_files")
      .select("id, file_name, storage_path")
      .eq("id", data.fileId)
      .eq("transfer_id", transfer.id)
      .maybeSingle();
    if (fErr) throw new Error("Lookup failed");
    if (!file) throw new Error("File not found");

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("transfers")
      .createSignedUrl(file.storage_path, 60 * 10, { download: file.file_name });
    if (sErr || !signed?.signedUrl) throw new Error("Could not sign URL");

    return { url: signed.signedUrl, fileName: file.file_name };
  });
