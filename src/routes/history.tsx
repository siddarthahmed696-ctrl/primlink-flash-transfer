import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, Copy, Download, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { formatBytes, formatExpiry } from "@/lib/format";
import { loadTransferHistory, type TransferHistoryItem } from "@/lib/transfers";
import { toast } from "sonner";

export const Route = createFileRoute("/history")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Transfer History — V Move You" },
      {
        name: "description",
        content: "Check your recent V Move You transfer links, expiry status, and download counts.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<TransferHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      setItems(await loadTransferHistory());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl sm:text-4xl font-bold">Transfer History</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Recent links saved on this device with live download counts.
            </p>
          </div>
          <button
            onClick={refresh}
            className="shrink-0 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Loading history…
          </div>
        ) : items.length === 0 ? (
          <section className="mt-8 rounded-lg border border-border bg-card p-6 sm:p-8 text-center">
            <Download className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">No transfers on this device</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New transfer links you create will appear here automatically.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-glow"
            >
              Create transfer
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-3">
            {items.map((item) => {
              const expired = new Date(item.expiresAt).getTime() < Date.now();
              return (
                <article key={item.id} className="rounded-lg border border-border bg-card p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold">Transfer {item.code}</h2>
                        <span className={`rounded px-2 py-0.5 text-xs ${expired ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                          {expired ? "Expired" : `Expires ${formatExpiry(item.expiresAt)}`}
                        </span>
                      </div>
                      <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
                        <span>{item.fileCount} {item.fileCount === 1 ? "file" : "files"}</span>
                        <span>{formatBytes(item.totalSize)}</span>
                        <span>{item.downloadCount} downloads</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" /> Created {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(item.url);
                          toast.success("Link copied");
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-elevated"
                      >
                        <Copy className="size-4" /> Copy
                      </button>
                      <a
                        href={item.url}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-glow"
                      >
                        <ExternalLink className="size-4" /> Open
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}