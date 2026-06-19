import { supabase } from "@/integrations/supabase/client";

const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  bytesUploaded: number;
  bytesTotal: number;
  percent: number;
}

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;
  if (!SUPABASE_PUBLISHABLE_KEY) throw new Error("Upload service is not configured");
  return SUPABASE_PUBLISHABLE_KEY;
}

export async function uploadFileResumable(opts: {
  file: File;
  bucket: string;
  objectPath: string;
  onProgress?: (p: { bytesUploaded: number; bytesTotal: number }) => void;
}): Promise<void> {
  const { file, bucket, objectPath, onProgress } = opts;
  await getAuthToken();

  const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  onProgress?.({ bytesUploaded: file.size, bytesTotal: file.size });
}
