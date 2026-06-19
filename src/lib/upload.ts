import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
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
  const token = await getAuthToken();
  void SUPABASE_URL;

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${token}`,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: objectPath,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024, // 6MB chunks required by Supabase resumable
      onError: (err) => reject(err),
      onProgress: (bytesUploaded, bytesTotal) =>
        onProgress?.({ bytesUploaded, bytesTotal }),
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
}
