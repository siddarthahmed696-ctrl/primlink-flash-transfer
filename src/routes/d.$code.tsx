import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Download, FileIcon, Loader2, ArrowLeft, Zap, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDownloadUrl } from "@/lib/downloads.functions";
import { formatBytes, formatExpiry } from "@/lib/format";
import { toast } from "sonner";

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
      { title: `Download files · Primlink Transfer` },
      {
        name: "description",
        content: `Someone shared files with you on Primlink Transfer. Tap to download.`,
      },
      { property: "og:title", content: "Files shared with you" },
      {
        property: "og:description",
        content: "Download the files shared via Primlink Transfer.",
      },
      { name: "robots", content: "noindex" },
    ],
    // params used to satisfy type-checker
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

function DownloadPage() {
  const { code } = Route.useParams();
  const fetchDownloadUrl = useServerFn(getDownloadUrl);
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

  const bumpCounter = async () => {
    if (!transfer) return;
    await supabase.rpc("increment_download_count", { _code: code } as never);
  };

  const downloadOne = async (f: FileRow) => {
    setDownloadingId(f.id);
    try {
      const { url } = await fetchDownloadUrl({ data: { code, fileId: f.id } });
      window.location.href = url;
      bumpCounter();
    } catch (e) {
      console.error(e);
      toast.error("Could not start download");
    } finally {
      setTimeout(() => setDownloadingId(null), 800);
    }
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    try {
      for (const f of files) {
        try {
          const { url } = await fetchDownloadUrl({ data: { code, fileId: f.id } });
          const a = document.createElement("a");
          a.href = url;
          a.download = f.file_name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          await new Promise((r) => setTimeout(r, 400));
        } catch (e) {
          console.error(e);
        }
      }
      bumpCounter();
    } finally {
      setDownloadingAll(false);
    }
  };


  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
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
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-border bg-gradient-to-b from-primary/10 to-transparent">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {expired ? "Expired" : `Expires in ${formatExpiry(transfer.expires_at)}`}
              <span>·</span>
              <span>{transfer.download_count} downloads</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold">
              {transfer.title || "Files shared with you"}
            </h1>
            {transfer.sender_email && (
              <p className="text-sm text-muted-foreground mt-1">
                From <span className="text-foreground">{transfer.sender_email}</span>
              </p>
            )}
            {transfer.message && (
              <p className="mt-4 text-sm bg-surface border border-border rounded-lg p-3 whitespace-pre-wrap">
                {transfer.message}
              </p>
            )}
            <div className="mt-5 text-sm text-muted-foreground">
              {files.length} {files.length === 1 ? "file" : "files"} ·{" "}
              {formatBytes(transfer.total_size)}
            </div>
          </div>

          {!expired && files.length > 0 && (
            <div className="p-4 border-b border-border">
              <button
                onClick={downloadAll}
                disabled={downloadingAll}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-lg hover:bg-primary-glow transition glow-red disabled:opacity-60"
              >
                {downloadingAll ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Download all ({formatBytes(transfer.total_size)})
              </button>
            </div>
          )}

          <ul className="divide-y divide-border">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-surface-elevated/50"
              >
                <FileIcon className="size-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f.file_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(f.file_size)}
                  </div>
                </div>
                <button
                  disabled={expired || downloadingId === f.id}
                  onClick={() => downloadOne(f)}
                  className="inline-flex items-center gap-1.5 bg-surface border border-border hover:border-primary text-sm px-3 py-1.5 rounded-md transition disabled:opacity-50"
                >
                  {downloadingId === f.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  Download
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Send your own transfer
        </Link>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
            <span className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground">
              <Zap className="size-4" />
            </span>
            Primlink<span className="text-primary">.</span>
          </Link>
        </div>
      </header>
      <div className="bg-grid opacity-40 absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative">{children}</div>
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
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{body}</p>
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
