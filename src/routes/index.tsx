import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Upload,
  X,
  File as FileIcon,
  Copy,
  Check,
  Loader2,
  Send,
  ExternalLink,
  Sparkles,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFileResumable } from "@/lib/upload";
import { formatBytes } from "@/lib/format";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UTransfer — Send big files fast, free, worldwide" },
      {
        name: "description",
        content:
          "Upload up to 10 GB and share a download link instantly. No login, no signup. Powered by Primlink.",
      },
      { property: "og:title", content: "UTransfer" },
      {
        property: "og:description",
        content: "Send up to 10 GB files with one share link. Free and fast.",
      },
    ],
  }),
  component: HomePage,
});

const MAX_BYTES = 10 * 1024 * 1024 * 1024;
const PRIMLINK_URL = "https://primlink.com";

type PerFileProgress = { name: string; size: number; sent: number };

function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState<PerFileProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalBytes = useMemo(() => files.reduce((a, f) => a + f.size, 0), [files]);
  const overLimit = totalBytes > MAX_BYTES;
  const totalSent = progress.reduce((a, p) => a + p.sent, 0);
  const overallPct = totalBytes > 0 ? Math.min(100, (totalSent / totalBytes) * 100) : 0;

  const onPickFiles = useCallback((picked: FileList | File[]) => {
    setFiles((prev) => [...prev, ...Array.from(picked)]);
  }, []);
  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));
  const reset = () => {
    setFiles([]);
    setProgress([]);
    setShareUrl(null);
    setRecipient("");
    setSender("");
    setMessage("");
    setTitle("");
  };

  const handleUpload = async () => {
    if (!files.length) return toast.error("Add at least one file");
    if (overLimit) return toast.error("Total size exceeds 10 GB limit");

    setUploading(true);
    setProgress(files.map((f) => ({ name: f.name, size: f.size, sent: 0 })));

    try {
      const { data: created, error: tErr } = await supabase.rpc("create_transfer", {
        _title: title || null,
        _message: message || null,
        _sender_email: sender || null,
        _recipient_email: recipient || null,
        _total_size: totalBytes,
      } as never);
      const transfer = (Array.isArray(created) ? created[0] : created) as
        | { id: string; share_code: string }
        | null;
      if (tErr || !transfer) throw tErr ?? new Error("Could not create transfer");

      const rows: Array<{
        file_name: string;
        file_size: number;
        content_type: string | null;
        storage_path: string;
      }> = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const safeName = file.name.replace(/[^\w.\-]+/g, "_");
        const objectPath = `${transfer.id}/${i}-${safeName}`;
        await uploadFileResumable({
          file,
          bucket: "transfers",
          objectPath,
          onProgress: ({ bytesUploaded }) =>
            setProgress((prev) => {
              const next = [...prev];
              next[i] = { ...next[i], sent: bytesUploaded };
              return next;
            }),
        });
        rows.push({
          file_name: file.name,
          file_size: file.size,
          content_type: file.type || null,
          storage_path: objectPath,
        });
      }

      const { error: fErr } = await supabase.rpc("add_transfer_files", {
        _transfer_id: transfer.id,
        _files: rows,
      });
      if (fErr) throw fErr;

      const host = window.location.host;
      const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com");
      const base = isPreview
        ? `https://primlink-flash-transfer.lovable.app`
        : window.location.origin;
      setShareUrl(`${base}/d/${transfer.share_code}`);
      toast.success("Transfer ready!");
    } catch (e) {
      console.error(e);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <SiteHeader />

      <main className="relative flex-1 min-h-0">
        {/* background */}
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "var(--gradient-hero)" }}
        />

        <div className="relative h-full mx-auto max-w-7xl px-4 sm:px-6 py-4 grid gap-4 lg:grid-cols-[380px_1fr]">
          {/* Left: WeTransfer-style upload widget */}
          <aside className="h-full min-h-0">
            <div className="h-full rounded-2xl border border-border bg-card shadow-card overflow-hidden flex flex-col">
              {!shareUrl ? (
                <>
                  <div className="px-5 pt-5 pb-3 border-b border-border">
                    <div className="text-sm text-muted-foreground">Send up to</div>
                    <div className="font-display text-2xl font-bold">10 GB free</div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        if (e.dataTransfer.files.length) onPickFiles(e.dataTransfer.files);
                      }}
                      onClick={() => inputRef.current?.click()}
                      className={`cursor-pointer p-5 rounded-xl border-2 border-dashed transition-all ${
                        dragOver
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/60 hover:bg-surface-elevated"
                      }`}
                    >
                      <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => e.target.files && onPickFiles(e.target.files)}
                      />
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className="size-11 rounded-full bg-primary/15 grid place-items-center text-primary">
                          {files.length ? <Plus className="size-5" /> : <Upload className="size-5" />}
                        </div>
                        <div className="text-sm">
                          <div className="font-semibold">
                            {files.length ? "Add more files" : "Add your files"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            or drop them here
                          </div>
                        </div>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-1.5">
                        {files.map((f, i) => {
                          const p = progress[i];
                          const pct = p && p.size ? (p.sent / p.size) * 100 : 0;
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-1.5 border border-border"
                            >
                              <FileIcon className="size-3.5 text-primary shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex justify-between text-xs">
                                  <span className="truncate">{f.name}</span>
                                  <span className="text-muted-foreground tabular-nums ml-2">
                                    {formatBytes(f.size)}
                                  </span>
                                </div>
                                {uploading && (
                                  <div className="mt-1 h-0.5 bg-muted rounded overflow-hidden">
                                    <div
                                      className="h-full bg-primary transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                              {!uploading && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(i);
                                  }}
                                  className="text-muted-foreground hover:text-primary"
                                  aria-label="Remove"
                                >
                                  <X className="size-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                        <div className="text-[11px] text-muted-foreground text-right">
                          {files.length} {files.length === 1 ? "file" : "files"} ·{" "}
                          {formatBytes(totalBytes)}
                        </div>
                      </div>
                    )}

                    <Input placeholder="Email to" value={recipient} onChange={setRecipient} type="email" />
                    <Input placeholder="Your email" value={sender} onChange={setSender} type="email" />
                    <Input placeholder="Title" value={title} onChange={setTitle} />
                    <textarea
                      placeholder="Message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="p-4 border-t border-border space-y-2">
                    {uploading && (
                      <div>
                        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                          <span>Uploading…</span>
                          <span className="tabular-nums">{overallPct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all"
                            style={{ width: `${overallPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !files.length || overLimit}
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-full hover:bg-primary-glow transition-colors glow-red disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="size-4" />
                          Transfer
                        </>
                      )}
                    </button>
                    {overLimit && (
                      <p className="text-[11px] text-primary text-center">
                        Total exceeds 10 GB limit
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <SuccessCard
                  shareUrl={shareUrl}
                  onCopy={copyLink}
                  copied={copied}
                  onReset={reset}
                  fileCount={files.length}
                  totalBytes={totalBytes}
                />
              )}
            </div>
          </aside>

          {/* Right: Primlink ad area */}
          <section className="h-full min-h-0">
            <a
              href={PRIMLINK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block h-full rounded-2xl overflow-hidden border border-border bg-card shadow-card"
              aria-label="Visit primlink.com"
            >
              {/* gradient art */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, oklch(0.62 0.24 25 / 0.55), transparent 55%), radial-gradient(circle at 80% 80%, oklch(0.45 0.2 20 / 0.6), transparent 60%), linear-gradient(135deg, oklch(0.17 0.012 20), oklch(0.13 0.01 20))",
                }}
              />
              <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

              <div className="absolute top-4 left-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground bg-background/40 backdrop-blur border border-border rounded-full px-2.5 py-1">
                <Sparkles className="size-3 text-primary" /> Sponsored
              </div>

              <div className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                primlink.com <ExternalLink className="size-3" />
              </div>

              <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-5">
                  <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                  Powered by Primlink
                </div>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] max-w-3xl">
                  Build, ship and <span className="text-gradient-red">grow faster</span>
                  <br />with Primlink.
                </h1>
                <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl">
                  The all-in-one platform behind UTransfer. Discover tools, apps and services
                  trusted by makers worldwide.
                </p>
                <span className="mt-7 inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-full glow-red group-hover:bg-primary-glow transition-colors">
                  Visit primlink.com <ExternalLink className="size-4" />
                </span>
                <div className="mt-5 text-[11px] text-muted-foreground">
                  Click anywhere on this panel to continue
                </div>
              </div>
            </a>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary"
    />
  );
}

function SuccessCard({
  shareUrl,
  onCopy,
  copied,
  onReset,
  fileCount,
  totalBytes,
}: {
  shareUrl: string;
  onCopy: () => void;
  copied: boolean;
  onReset: () => void;
  fileCount: number;
  totalBytes: number;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
      <div className="size-14 rounded-full bg-primary/15 grid place-items-center text-primary mb-3">
        <Check className="size-7" />
      </div>
      <h2 className="text-2xl font-bold">Transfer ready</h2>
      <p className="text-muted-foreground text-sm mt-1">
        {fileCount} {fileCount === 1 ? "file" : "files"} · {formatBytes(totalBytes)}
      </p>
      <div className="mt-5 w-full flex items-center gap-2 bg-surface border border-border rounded-lg p-2">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 bg-transparent px-2 text-sm focus:outline-none truncate"
        />
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-glow transition"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <button
        onClick={onReset}
        className="mt-4 inline-flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-md px-4 py-2 text-sm transition"
      >
        New transfer
      </button>
    </div>
  );
}
