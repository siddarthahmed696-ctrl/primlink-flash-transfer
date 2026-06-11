import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Upload,
  X,
  File as FileIcon,
  Copy,
  Check,
  Mail,
  Zap,
  Globe2,
  ShieldCheck,
  Loader2,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFileResumable } from "@/lib/upload";
import { formatBytes } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Primlink Transfer — Send big files, fast, anywhere" },
      {
        name: "description",
        content:
          "Upload up to 10 GB and share a download link with anyone in seconds. Free, fast, worldwide file transfer by Primlink.",
      },
      { property: "og:title", content: "Primlink Transfer" },
      {
        property: "og:description",
        content: "Send up to 10 GB files with a single share link. Fast, free, global.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const MAX_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

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
    const next = Array.from(picked);
    setFiles((prev) => [...prev, ...next]);
  }, []);

  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

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
      // 1) Create the transfer row
      const { data: transfer, error: tErr } = await supabase
        .from("transfers")
        .insert({
          title: title || null,
          message: message || null,
          sender_email: sender || null,
          recipient_email: recipient || null,
          total_size: totalBytes,
        })
        .select("id, share_code")
        .single();
      if (tErr || !transfer) throw tErr ?? new Error("Could not create transfer");

      // 2) Upload each file via resumable tus
      const rows: Array<{
        transfer_id: string;
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
          transfer_id: transfer.id,
          file_name: file.name,
          file_size: file.size,
          content_type: file.type || null,
          storage_path: objectPath,
        });
      }

      // 3) Save file rows
      const { error: fErr } = await supabase.from("transfer_files").insert(rows);
      if (fErr) throw fErr;

      // Always use the stable public domain so recipients never hit
      // the Lovable preview login wall.
      const host = window.location.host;
      const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com");
      const base = isPreview
        ? `https://primlink-flash-transfer.lovable.app`
        : window.location.origin;
      const url = `${base}/d/${transfer.share_code}`;
      setShareUrl(url);

      // 4) Optional: email recipient via mailto
      if (recipient) {
        const subject = encodeURIComponent(
          title ? `${sender || "Someone"} sent you "${title}"` : `Files from ${sender || "Primlink"}`,
        );
        const body = encodeURIComponent(
          `${message ? message + "\n\n" : ""}Download here (link expires in 7 days):\n${url}\n\n— Sent via Primlink Transfer`,
        );
        window.open(`mailto:${recipient}?subject=${subject}&body=${body}`, "_blank");
      }

      toast.success("Transfer ready! Share the link.");
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="relative">
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div
          className="absolute inset-x-0 top-0 h-[600px] pointer-events-none"
          style={{ background: "var(--gradient-hero)" }}
        />

        <section className="relative mx-auto max-w-6xl px-6 pt-16 pb-10 lg:pt-24">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-6">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Worldwide • Up to 10 GB • Free
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02]">
                Send <span className="text-gradient-red">huge files</span>
                <br />
                in one click.
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                Drop your files, get a download link, share it with anyone on Earth.
                Primlink Transfer keeps it brutally simple — no account, no waiting.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                <Feature icon={<Zap className="size-4" />} label="Fast" />
                <Feature icon={<Globe2 className="size-4" />} label="Global" />
                <Feature icon={<ShieldCheck className="size-4" />} label="Private" />
              </div>
            </div>

            {/* Upload card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-3xl pointer-events-none" />
              <div className="relative rounded-2xl border border-border bg-card shadow-card overflow-hidden">
                {!shareUrl ? (
                  <>
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
                      className={`cursor-pointer p-8 m-4 rounded-xl border-2 border-dashed transition-all ${
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
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="size-14 rounded-full bg-primary/15 grid place-items-center text-primary">
                          <Upload className="size-6" />
                        </div>
                        <div>
                          <div className="font-semibold">Drop files here</div>
                          <div className="text-sm text-muted-foreground">
                            or click to browse · up to 10 GB total
                          </div>
                        </div>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="px-4 pb-2 max-h-56 overflow-y-auto space-y-2">
                        {files.map((f, i) => {
                          const p = progress[i];
                          const pct = p && p.size ? (p.sent / p.size) * 100 : 0;
                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2 border border-border"
                            >
                              <FileIcon className="size-4 text-primary shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex justify-between text-sm">
                                  <span className="truncate">{f.name}</span>
                                  <span className="text-muted-foreground tabular-nums ml-2">
                                    {formatBytes(f.size)}
                                  </span>
                                </div>
                                {uploading && (
                                  <div className="mt-1 h-1 bg-muted rounded overflow-hidden">
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
                                  <X className="size-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="p-4 space-y-3 border-t border-border">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Send to (email, optional)"
                          value={recipient}
                          onChange={setRecipient}
                          type="email"
                        />
                        <Input
                          placeholder="Your email (optional)"
                          value={sender}
                          onChange={setSender}
                          type="email"
                        />
                      </div>
                      <Input
                        placeholder="Title (optional)"
                        value={title}
                        onChange={setTitle}
                      />
                      <textarea
                        placeholder="Message (optional)"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={2}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                      />

                      {uploading && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Uploading…</span>
                            <span className="tabular-nums">
                              {formatBytes(totalSent)} / {formatBytes(totalBytes)} ·{" "}
                              {overallPct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded overflow-hidden">
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
                        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-3 rounded-lg hover:bg-primary-glow transition-colors glow-red disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Sending {formatBytes(totalBytes)}…
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            {recipient ? "Send transfer" : "Get a share link"}
                          </>
                        )}
                      </button>
                      {overLimit && (
                        <p className="text-xs text-primary text-center">
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
                    recipient={recipient}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-10 border-b border-border/60 backdrop-blur bg-background/60">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <span className="size-7 rounded-md bg-primary grid place-items-center text-primary-foreground">
            <Zap className="size-4" />
          </span>
          Primlink<span className="text-primary">.</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        </nav>
      </div>
    </header>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      <span className="text-primary">{icon}</span>
      {label}
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
  recipient,
}: {
  shareUrl: string;
  onCopy: () => void;
  copied: boolean;
  onReset: () => void;
  fileCount: number;
  totalBytes: number;
  recipient: string;
}) {
  return (
    <div className="p-6 text-center">
      <div className="size-14 mx-auto rounded-full bg-primary/15 grid place-items-center text-primary mb-3">
        <Check className="size-7" />
      </div>
      <h2 className="text-2xl font-bold">Transfer ready</h2>
      <p className="text-muted-foreground text-sm mt-1">
        {fileCount} {fileCount === 1 ? "file" : "files"} · {formatBytes(totalBytes)} · expires in 7 days
      </p>

      <div className="mt-5 flex items-center gap-2 bg-surface border border-border rounded-lg p-2">
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

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={`mailto:${recipient}?subject=${encodeURIComponent("Files for you")}&body=${encodeURIComponent(`Download here:\n${shareUrl}`)}`}
          className="inline-flex items-center justify-center gap-2 border border-border bg-surface hover:bg-surface-elevated rounded-md px-3 py-2 text-sm transition"
        >
          <Mail className="size-4" /> Email link
        </a>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-md px-3 py-2 text-sm transition"
        >
          New transfer
        </button>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Drop your files", d: "Add up to 10 GB. Any file type. No sign-up." },
    { n: "02", t: "Get the link", d: "We generate a secure share link in seconds." },
    { n: "03", t: "Anyone, anywhere", d: "Send to one person or a crowd. Worldwide." },
  ];
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-24">
      <h2 className="text-3xl sm:text-4xl font-bold text-center">
        Three steps. <span className="text-gradient-red">Zero friction.</span>
      </h2>
      <div className="mt-12 grid md:grid-cols-3 gap-5">
        {steps.map((s) => (
          <div
            key={s.n}
            className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/60 transition-colors"
          >
            <div className="text-primary font-display text-4xl font-bold">{s.n}</div>
            <div className="mt-3 font-semibold text-lg">{s.t}</div>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 mt-12">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} Primlink Transfer</div>
        <div>Built for speed. Made for the world.</div>
      </div>
    </footer>
  );
}
