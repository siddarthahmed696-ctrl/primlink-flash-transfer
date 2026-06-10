import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  bytesUploaded: number;
  bytesTotal: number;
  percent: number;
}

export async function uploadFileResumable(opts: {
  file: File;
  bucket: string;
  objectPath: string;
  onProgress?: (p: { bytesUploaded: number; bytesTotal: number }) => void;
}): Promise<void> {
  const { file, bucket, objectPath, onProgress } = opts;
  const { data: sessionData } = await supabase.auth.getSession();
  const token =
    sessionData.session?.access_token ??
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string);

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${token}`,
        "x-upsert": "true",
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
