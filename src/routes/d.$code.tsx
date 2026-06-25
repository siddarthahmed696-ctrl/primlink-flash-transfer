import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Download, FileIcon, Loader2, ArrowLeft, Clock } from "lucide-react";
import { apiJson, downloadUrl } from "@/lib/api";
import { formatBytes, formatExpiry } from "@/lib/format";
import { SiteHeader } from "@/components/site-header";
import { AdBackdrop, useAdRotator, useLiveAds, FALLBACK_AD, AdsSyncStatusIndicator } from "@/components/ad-rotator";
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
  head: () => ({
    meta: [
      { title: `Download files · V Move You Transfer` },
      { name: "description", content: `Someone shared files with you on V Move You Transfer. Tap to download.` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DownloadPage,
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
      try {
        const data = await apiJson<{ transfer: TransferRow; files: FileRow[] }>(
          `/get_transfer.php?code=${encodeURIComponent(code)}`
        );
        setTransfer(data.transfer);
        setFiles(data.files || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setTransfer(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const expired = transfer ? new Date(transfer.expires_at).getTime() < Date.now() : false;

  const startDownload = (fileId: string) => {
    window.location.href = downloadUrl(code, fileId);
  };

  const downloadOne = async (f: FileRow) => {
    setDownloadingId(f.id);
    try {
      startDownload(f.id);
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
        startDownload(f.id);
        await new Promise((r) => setTimeout(r, 1000));
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
      <Shell>
        <div className="mx-auto max-w-md text-center py-24 px-6">
          <h1 className="text-2xl font-bold text-white">Link not found</h1>
          <p className="mt-2 text-white/70">This transfer link does not exist or was removed.</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <div
          className="rounded-2xl border border-white/15 overflow-hidden"
          style={{
            background: "transparent",
            backdropFilter: "blur(20px) saturate(140%)",
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
              {files.length} {files.length === 1 ? "file" : "files"} · {formatBytes(transfer.total_size)}
            </div>
          </div>

          {!expired && files.length > 0 && (
            <div className="p-4 border-b border-white/10">
              {files.length === 1 ? (
                <a
                  href={downloadUrl(code, files[0].id)}
                  className="w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-4 py-3 rounded-lg text-center"
                  style={{ background: ACCENT }}
                >
                  <Download className="size-4" /> Download ({formatBytes(transfer.total_size)})
                </a>
              ) : (
                <button
                  onClick={downloadAll}
                  disabled={downloadingAll}
                  className="w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-4 py-3 rounded-lg transition disabled:opacity-60"
                  style={{ background: ACCENT }}
                >
                  {downloadingAll ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Download all ({formatBytes(transfer.total_size)})
                </button>
              )}
            </div>
          )}

          <ul className="divide-y divide-white/10">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-white/5">
                <FileIcon className="size-5 text-white/80 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{f.file_name}</div>
                  <div className="text-xs text-white/60">{formatBytes(f.file_size)}</div>
                </div>
                {expired ? (
                  <button disabled className="bg-black/30 text-sm text-white px-3 py-1.5 rounded-md opacity-50">Expired</button>
                ) : (
                  <button onClick={() => downloadOne(f)} disabled={downloadingId === f.id} className="bg-black/30 text-sm text-white px-3 py-1.5 rounded-md">
                    {downloadingId === f.id ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Download
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
          <ArrowLeft className="size-4" /> Send your own transfer
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const getAds = useServerFn(listActiveAdsSigned);
  const { ads, status: adsStatus } = useLiveAds(getAds);
  const ad = useAdRotator(ads, 30_000) ?? FALLBACK_AD;
  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AdBackdrop ad={ad} />
      <AdsSyncStatusIndicator status={adsStatus} className="fixed bottom-3 left-3 z-30" />
      <div className="relative z-10 min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
