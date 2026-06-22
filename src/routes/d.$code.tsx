import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Download, FileIcon, Loader2, ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes, formatExpiry } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { AdBackdrop, useAdRotator, FALLBACK_AD } from "@/components/ad-rotator";
import type { ResolvedAd } from "@/lib/ads";
import { listActiveAdsSigned } from "@/lib/ads.functions";

interface TransferRow {
  id: string;
  share_code: string;
  title: string | null;
  message: string | null;
  sender_email: string | null;
  total_size: number;
  download_count: number;
  created_at: string;
  expires_at: string;
}
interface FileRow {
  id: string;
  file_name: string;
  file_size: number;
  content_type: string | null;
}

export const Route = createFileRoute("/d/$code")({
  head: ({ params }) => ({
    meta: [
      { title: `Download files · V Move You Transfer` },
      {
        name: "description",
        content: `Someone shared files with you on V Move You Transfer. Tap to download.`,
      },
      { property: "og:title", content: "Files shared with you" },
      {
        property: "og:description",
        content: "Download the files shared via V Move You Transfer.",
      },
      { name: "robots", content: "noindex" },
    ],
    ...(params.code ? {} : {}),
  }),
  component: DownloadPage,
  notFoundComponent: () => (
    <ShellMessage title="Link not found" body="This transfer link does not exist or was removed." />
  ),
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <ShellMessage
        title="Something went wrong"
        body="We couldn't load this transfer. Please try again."
        action={
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary-glow"
          >
            Try again
          </button>
        }
      />
    );
  },
});

const ACCENT = "#2563eb";

function DownloadPage() {
  const { code } = Route.useParams();
  const [transfer, setTransfer] = useState<TransferRow | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase.rpc("get_transfer_by_code", {
        _code: code,
      } as never);
      const row = (Array.isArray(t) ? t[0] : t) as TransferRow | null;
      if (!row) {
        setLoading(false);
        return;
      }
      setTransfer(row);
      const { data: f } = await supabase.rpc("get_transfer_files_by_code", {
        _code: code,
      } as never);
      setFiles(((f ?? []) as unknown) as FileRow[]);
      setLoading(false);
    })();
  }, [code]);

  const expired = transfer ? new Date(transfer.expires_at).getTime() < Date.now() : false;

  const startDownload = async (fileId: string, fileName: string) => {
    const { data, error } = await supabase.rpc("get_download_path", {
      _code: code,
      _file_id: fileId,
    } as never);
    const row = (Array.isArray(data) ? data[0] : data) as
      | { storage_path: string; file_name: string }
      | null;
    if (error || !row) throw new Error("File not found or expired");
    const { data: signed, error: signErr } = await supabase.storage
      .from("transfers")
      .createSignedUrl(row.storage_path, 600, { download: fileName });
    if (signErr || !signed?.signedUrl) throw new Error("Could not start download");
    await supabase.rpc("increment_download_count", { _code: code } as never);
    const a = document.createElement("a");
    a.href = signed.signedUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadOne = async (f: FileRow) => {
    setDownloadingId(f.id);
    try {
      await startDownload(f.id, f.file_name);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (const f of files) {
        try {
          await startDownload(f.id, f.file_name);
          await new Promise((r) => setTimeout(r, 500));
        } catch (e) {
          console.error(e);
        }
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-24 text-white/80">
          <Loader2 className="size-5 animate-spin mr-2" /> Loading transfer…
        </div>
      </Shell>
    );
  }

  if (!transfer) {
    return (
      <ShellMessage
        title="Link not found"
        body="This transfer link does not exist or was removed."
      />
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <div
          className="rounded-2xl border border-white/15 overflow-hidden animate-[ut_in_700ms_ease-out_both]"
          style={{
            background: "transparent",
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
          }}
        >
          <div className="p-6 sm:p-8 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Clock className="size-3.5" />
              {expired ? "Expired" : `Expires in ${formatExpiry(transfer.expires_at)}`}
              <span>·</span>
              <span>{transfer.download_count} downloads</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              {transfer.title || "Files shared with you"}
            </h1>
            {transfer.sender_email && (
              <p className="text-sm text-white/70 mt-1">
                From <span className="text-white">{transfer.sender_email}</span>
              </p>
            )}
            {transfer.message && (
              <p className="mt-4 text-sm bg-black/30 border border-white/10 rounded-lg p-3 whitespace-pre-wrap text-white/90">
                {transfer.message}
              </p>
            )}
            <div className="mt-5 text-sm text-white/70">
              {files.length} {files.length === 1 ? "file" : "files"} ·{" "}
              {formatBytes(transfer.total_size)}
            </div>
          </div>

          {!expired && files.length > 0 && (
            <div className="p-4 border-b border-white/10">
              {files.length === 1 ? (
                <button
                  onClick={() => downloadOne(files[0])}
                  disabled={downloadingId === files[0].id}
                  className="w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-4 py-3 rounded-lg transition disabled:opacity-60"
                  style={{ background: ACCENT, boxShadow: `0 10px 30px -10px ${ACCENT}` }}
                >
                  {downloadingId === files[0].id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download ({formatBytes(transfer.total_size)})
                </button>
              ) : (
                <button
                  onClick={downloadAll}
                  disabled={downloadingAll}
                  className="w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-4 py-3 rounded-lg transition disabled:opacity-60"
                  style={{ background: ACCENT, boxShadow: `0 10px 30px -10px ${ACCENT}` }}
                >
                  {downloadingAll ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download all ({formatBytes(transfer.total_size)})
                </button>
              )}
            </div>
          )}

          <ul className="divide-y divide-white/10">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-white/5"
              >
                <FileIcon className="size-5 text-white/80 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{f.file_name}</div>
                  <div className="text-xs text-white/60">{formatBytes(f.file_size)}</div>
                </div>
                {expired ? (
                  <button
                    disabled
                    className="inline-flex items-center gap-1.5 bg-black/30 border border-white/10 text-sm text-white px-3 py-1.5 rounded-md opacity-50"
                  >
                    <Download className="size-3.5" />
                    Download
                  </button>
                ) : (
                  <button
                    onClick={() => downloadOne(f)}
                    disabled={downloadingId === f.id}
                    className="inline-flex items-center gap-1.5 bg-black/30 border border-white/15 hover:border-white/40 text-sm text-white px-3 py-1.5 rounded-md transition disabled:opacity-60"
                  >
                    {downloadingId === f.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    Download
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Send your own transfer
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const getAds = useServerFn(listActiveAdsSigned);
  const [ads, setAds] = useState<ResolvedAd[]>([]);
  useEffect(() => {
    getAds().then(setAds).catch(() => {});
  }, [getAds]);
  const ad = useAdRotator(ads, 30_000) ?? FALLBACK_AD;

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AdBackdrop ad={ad} />
      <div className="relative z-10 min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </div>
      <style>{`@keyframes ut_in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

function ShellMessage({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Shell>
      <div className="mx-auto max-w-md text-center py-24 px-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-white/70">{body}</p>
        <div className="mt-6">
          {action ?? (
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary-glow"
            >
              Go to homepage
            </Link>
          )}
        </div>
      </div>
    </Shell>
  );
}
