import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  X,
  File as FileIcon,
  Copy,
  Check,
  Loader2,
  Send,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFileResumable } from "@/lib/upload";
import { formatBytes } from "@/lib/format";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { AdBackdrop, useAdRotator, FALLBACK_AD } from "@/components/ad-rotator";
import { IntroSplash } from "@/components/intro-splash";
import { CookieBanner } from "@/components/cookie-banner";
import { fetchActiveAds, type ResolvedAd } from "@/lib/ads";
import { startVisitorHeartbeat } from "@/lib/visitors";

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

const MAX_BYTES = 5 * 1024 * 1024 * 1024;
const ACCENT = "#ef4444";

type PerFileProgress = { name: string; size: number; sent: number };

function HomePage() {
  const [ads, setAds] = useState<ResolvedAd[]>([]);
  useEffect(() => {
    fetchActiveAds().then(setAds).catch(() => {});
    const stop = startVisitorHeartbeat();
    return stop;
  }, []);
  const ad = useAdRotator(ads, 30_000) ?? FALLBACK_AD;

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

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="h-screen flex flex-col overflow-hidden text-foreground relative">
      <IntroSplash />
      <AdBackdrop ad={ad} />

      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="pointer-events-auto">
          <SiteHeader />
        </div>

        <main className="flex-1 min-h-0 relative">
          <div
            onClick={stop}
            className="pointer-events-auto absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-[320px] max-h-[calc(100vh-7rem)] flex flex-col rounded-2xl border border-white/15 overflow-hidden animate-[ut_in_700ms_ease-out_both]"
            style={{
              background: "transparent",
              backdropFilter: "blur(20px) saturate(140%)",
              boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
            }}
          >

            {!shareUrl ? (
              <>
                <div className="px-4 pt-4 pb-2">
                  <div className="text-[11px] uppercase tracking-widest text-white/60">
                    Send up to
                  </div>
                  <div className="font-display text-xl font-bold text-white">10 GB free</div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
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
                    className={`cursor-pointer p-3 rounded-xl border-2 border-dashed transition-all ${
                      dragOver ? "bg-white/10" : "hover:bg-white/5"
                    }`}
                    style={{ borderColor: `${ACCENT}88` }}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && onPickFiles(e.target.files)}
                    />
                    <div className="flex items-center gap-3">
                      <div
                        className="size-9 rounded-full grid place-items-center text-white shrink-0"
                        style={{ background: ACCENT }}
                      >
                        {files.length ? <Plus className="size-4" /> : <Upload className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-white">
                          {files.length ? "Add more files" : "Add your files"}
                        </div>
                        <div className="text-[11px] text-white/60">or drop them here</div>
                      </div>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-1">
                      {files.map((f, i) => {
                        const p = progress[i];
                        const pct = p && p.size ? (p.sent / p.size) * 100 : 0;
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-lg bg-black/30 px-2 py-1.5 border border-white/10"
                          >
                            <FileIcon className="size-3 text-white/70 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between text-[11px] text-white">
                                <span className="truncate">{f.name}</span>
                                <span className="text-white/60 tabular-nums ml-2">
                                  {formatBytes(f.size)}
                                </span>
                              </div>
                              {uploading && (
                                <div className="mt-1 h-0.5 bg-white/10 rounded overflow-hidden">
                                  <div
                                    className="h-full transition-all"
                                    style={{ width: `${pct}%`, background: ACCENT }}
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
                                className="text-white/60 hover:text-white"
                                aria-label="Remove"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <div className="text-[10px] text-white/60 text-right">
                        {files.length} · {formatBytes(totalBytes)}
                      </div>
                    </div>
                  )}

                  <GlassInput placeholder="Email to" value={recipient} onChange={setRecipient} type="email" />
                  <GlassInput placeholder="Your email" value={sender} onChange={setSender} type="email" />
                  <GlassInput placeholder="Title" value={title} onChange={setTitle} />
                  <textarea
                    placeholder="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={2}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none resize-none"
                  />
                </div>

                <div className="p-3 border-t border-white/10 space-y-2">
                  {uploading && (
                    <div>
                      <div className="flex justify-between text-[10px] text-white/70 mb-1">
                        <span>Uploading…</span>
                        <span className="tabular-nums">{overallPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${overallPct}%`, background: ACCENT }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !files.length || overLimit}
                    className="w-full inline-flex items-center justify-center gap-2 text-white font-semibold px-4 py-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: ACCENT, boxShadow: `0 10px 30px -10px ${ACCENT}` }}
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
                    <p className="text-[11px] text-white text-center">Exceeds 10 GB limit</p>
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
        </main>

        <div className="pointer-events-auto">
          <SiteFooter />
        </div>
      </div>

      <CookieBanner />

      <style>{`@keyframes ut_in { from { opacity: 0; transform: translate(-12px, -50%); } to { opacity: 1; transform: translate(0, -50%); } }`}</style>
    </div>
  );
}

function GlassInput({
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
      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none"
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
    <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
      <div
        className="size-12 rounded-full grid place-items-center text-white mb-3"
        style={{ background: ACCENT }}
      >
        <Check className="size-6" />
      </div>
      <h2 className="text-lg font-bold text-white">Transfer ready</h2>
      <p className="text-white/70 text-xs mt-1">
        {fileCount} {fileCount === 1 ? "file" : "files"} · {formatBytes(totalBytes)}
      </p>
      <div className="mt-4 w-full flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1.5">
        <input
          readOnly
          value={shareUrl}
          className="flex-1 bg-transparent px-2 text-xs text-white focus:outline-none truncate"
        />
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 text-white px-2.5 py-1.5 rounded-md text-xs font-medium transition"
          style={{ background: ACCENT }}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <button
        onClick={onReset}
        className="mt-3 inline-flex items-center justify-center gap-2 text-white border border-white/20 hover:bg-white/10 rounded-md px-3 py-1.5 text-xs transition"
      >
        New transfer
      </button>
    </div>
  );
}
