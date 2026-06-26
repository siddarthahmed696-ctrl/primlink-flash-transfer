import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Download,
  FileIcon,
  Loader2,
  ArrowLeft,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import {
  AdBackdrop,
  useAdRotator,
  useLiveAds,
  FALLBACK_AD,
  AdsSyncStatusIndicator,
} from "@/components/ad-rotator";
import { listActiveAdsSigned } from "@/lib/ads.functions";

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = "https://backend.vmoveyou.com";
const ACCENT   = "#2563eb";
const SPIN_CSS = "@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k     = 1024;
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i     = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  return `${+(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}

function formatExpiry(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TransferFile {
  id:   string;
  name: string;
  size: number;
  type: string;
  url:  string;
}

interface TransferData {
  code:        string;
  senderName:  string;
  senderEmail: string;
  message?:    string;
  files:       TransferFile[];
  expiresAt:   string;
  createdAt:   string;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/d/$code")({
  head: () => ({
    meta: [
      { title: "Download files · V Move You Transfer" },
      {
        name: "description",
        content:
          "Someone shared files with you on V Move You Transfer. Tap to download.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),

  loader: async ({ params }): Promise<TransferData> => {
    const res = await fetch(
      `${API_BASE}/api/transfer/${encodeURIComponent(params.code)}`
    );
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? "Transfer not found or has expired."
          : `Server error (${res.status})`
      );
    }
    return res.json() as Promise<TransferData>;
  },

  pendingComponent: PendingState,
  errorComponent:   ErrorState,
  component:        DownloadPage,
});

// ── Pending ───────────────────────────────────────────────────────────────────

function PendingState() {
  return (
    <Shell>
      <style>{SPIN_CSS}</style>
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "6rem 0",
          color:          "rgba(255,255,255,.8)",
        }}
      >
        <Loader2
          style={{
            width:     20,
            height:    20,
            marginRight: 8,
            animation: "spin 1s linear infinite",
          }}
        />
        Loading transfer…
      </div>
    </Shell>
  );
}

// ── Error ─────────────────────────────────────────────────────────────────────

function ErrorState({ error }: { error: unknown }) {
  const msg =
    error instanceof Error
      ? error.message
      : "This transfer does not exist or has been removed.";

  return (
    <Shell>
      <div
        style={{
          maxWidth:  448,
          margin:    "0 auto",
          textAlign: "center",
          padding:   "6rem 1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
          Link not found
        </h1>
        <p style={{ marginTop: 8, color: "rgba(255,255,255,.7)" }}>{msg}</p>
        <Link
          to="/"
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            6,
            marginTop:      24,
            fontSize:       ".875rem",
            color:          "rgba(255,255,255,.8)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back to Home
        </Link>
      </div>
    </Shell>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function DownloadPage() {
  const transfer = Route.useLoaderData();

  const [copied,        setCopied]        = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const expired   = new Date(transfer.expiresAt).getTime() < Date.now();
  const totalSize = transfer.files.reduce((s, f) => s + f.size, 0);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadAll = async () => {
    setDownloadingAll(true);
    for (const f of transfer.files) {
      const a = document.createElement("a");
      a.href     = f.url;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise((r) => setTimeout(r, 800));
    }
    setDownloadingAll(false);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Shell>
      <style>{SPIN_CSS}</style>

      <div style={{ maxWidth: 672, margin: "0 auto", padding: "2.5rem 1rem" }}>

        {/* ── Card ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            borderRadius:        16,
            border:              "1px solid rgba(255,255,255,.15)",
            overflow:            "hidden",
            backdropFilter:      "blur(20px) saturate(140%)",
            WebkitBackdropFilter:"blur(20px) saturate(140%)",
            boxShadow:           "0 30px 80px -20px rgba(0,0,0,.6)",
          }}
        >

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div
            style={{
              padding:      "1.5rem 2rem",
              borderBottom: "1px solid rgba(255,255,255,.1)",
            }}
          >
            {/* Code badge + expiry */}
            <div
              style={{
                display:     "flex",
                alignItems:  "center",
                flexWrap:    "wrap",
                gap:         8,
                fontSize:    ".75rem",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  background: "rgba(255,255,255,.1)",
                  color:      "#fff",
                  borderRadius: 6,
                  padding:    "2px 8px",
                  letterSpacing: ".04em",
                }}
              >
                {transfer.code}
              </span>
              <Clock style={{ width: 13, height: 13, color: "rgba(255,255,255,.55)" }} />
              <span style={{ color: expired ? "#f87171" : "rgba(255,255,255,.65)" }}>
                {expired ? "Expired" : formatExpiry(transfer.expiresAt)}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                marginTop:  8,
                fontSize:   "1.75rem",
                fontWeight: 700,
                color:      "#fff",
                lineHeight: 1.2,
              }}
            >
              Files shared with you
            </h1>

            {/* Sender */}
            <p
              style={{
                marginTop: 4,
                fontSize:  ".875rem",
                color:     "rgba(255,255,255,.7)",
              }}
            >
              From{" "}
              <span style={{ color: "#fff" }}>{transfer.senderName}</span>
              {transfer.senderEmail && (
                <>
                  {" · "}
                  <span style={{ color: "rgba(255,255,255,.6)" }}>
                    {transfer.senderEmail}
                  </span>
                </>
              )}
            </p>

            {/* Optional message */}
            {transfer.message && (
              <p
                style={{
                  marginTop:   16,
                  fontSize:    ".875rem",
                  background:  "rgba(0,0,0,.3)",
                  border:      "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8,
                  padding:     "0.75rem",
                  whiteSpace:  "pre-wrap",
                  color:       "rgba(255,255,255,.9)",
                }}
              >
                {transfer.message}
              </p>
            )}

            {/* File summary */}
            <div
              style={{
                marginTop: 20,
                fontSize:  ".875rem",
                color:     "rgba(255,255,255,.65)",
              }}
            >
              {transfer.files.length}{" "}
              {transfer.files.length === 1 ? "file" : "files"} ·{" "}
              {formatBytes(totalSize)}
            </div>
          </div>

          {/* ── Action bar ───────────────────────────────────────────────── */}
          <div
            style={{
              padding:      "0.875rem 1rem",
              borderBottom: "1px solid rgba(255,255,255,.1)",
              display:      "flex",
              gap:          8,
              flexWrap:     "wrap",
            }}
          >
            {/* Primary download action (hidden when expired) */}
            {!expired && transfer.files.length > 0 && (
              transfer.files.length === 1 ? (
                <a
                  href={transfer.files[0].url}
                  download={transfer.files[0].name}
                  style={{
                    flex:           1,
                    display:        "inline-flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    gap:            8,
                    background:     ACCENT,
                    color:          "#fff",
                    fontWeight:     600,
                    fontSize:       ".9375rem",
                    padding:        "0.75rem 1rem",
                    borderRadius:   8,
                    textDecoration: "none",
                    minWidth:       0,
                  }}
                >
                  <Download style={{ width: 16, height: 16, flexShrink: 0 }} />
                  Download ({formatBytes(totalSize)})
                </a>
              ) : (
                <button
                  onClick={downloadAll}
                  disabled={downloadingAll}
                  style={{
                    flex:           1,
                    display:        "inline-flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    gap:            8,
                    background:     ACCENT,
                    color:          "#fff",
                    fontWeight:     600,
                    fontSize:       ".9375rem",
                    padding:        "0.75rem 1rem",
                    borderRadius:   8,
                    border:         "none",
                    cursor:         downloadingAll ? "not-allowed" : "pointer",
                    opacity:        downloadingAll ? 0.6 : 1,
                    minWidth:       0,
                  }}
                >
                  {downloadingAll ? (
                    <Loader2
                      style={{
                        width:     16,
                        height:    16,
                        flexShrink: 0,
                        animation: "spin 1s linear infinite",
                      }}
                    />
                  ) : (
                    <Download style={{ width: 16, height: 16, flexShrink: 0 }} />
                  )}
                  {downloadingAll
                    ? "Downloading…"
                    : `Download all (${formatBytes(totalSize)})`}
                </button>
              )
            )}

            {/* Copy link — always visible */}
            <button
              onClick={copyLink}
              style={{
                display:     "inline-flex",
                alignItems:  "center",
                gap:         6,
                background:  "rgba(255,255,255,.08)",
                color:       "#fff",
                fontWeight:  500,
                fontSize:    ".875rem",
                padding:     "0.75rem 1rem",
                borderRadius: 8,
                border:      "1px solid rgba(255,255,255,.15)",
                cursor:      "pointer",
                whiteSpace:  "nowrap",
                flexShrink:  0,
              }}
            >
              {copied ? (
                <Check style={{ width: 14, height: 14, color: "#4ade80" }} />
              ) : (
                <Copy style={{ width: 14, height: 14 }} />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {/* ── File list ────────────────────────────────────────────────── */}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {transfer.files.map((f, i) => (
              <li
                key={f.id}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          12,
                  padding:      "0.75rem 1.5rem",
                  borderBottom:
                    i < transfer.files.length - 1
                      ? "1px solid rgba(255,255,255,.1)"
                      : "none",
                }}
              >
                <FileIcon
                  style={{
                    width:     20,
                    height:    20,
                    color:     "rgba(255,255,255,.8)",
                    flexShrink: 0,
                  }}
                />

                {/* Name + size */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      color:        "#fff",
                      fontSize:     ".875rem",
                      fontWeight:   500,
                      overflow:     "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace:   "nowrap",
                    }}
                  >
                    {f.name}
                  </div>
                  <div
                    style={{ color: "rgba(255,255,255,.6)", fontSize: ".75rem" }}
                  >
                    {formatBytes(f.size)}
                  </div>
                </div>

                {/* Action */}
                {expired ? (
                  <span
                    style={{
                      background:   "rgba(0,0,0,.3)",
                      color:        "rgba(255,255,255,.45)",
                      fontSize:     ".8125rem",
                      padding:      "0.375rem 0.75rem",
                      borderRadius: 6,
                      flexShrink:   0,
                    }}
                  >
                    Expired
                  </span>
                ) : (
                  <a
                    href={f.url}
                    download={f.name}
                    style={{
                      display:        "inline-flex",
                      alignItems:     "center",
                      gap:            4,
                      background:     "rgba(0,0,0,.3)",
                      color:          "#fff",
                      fontSize:       ".8125rem",
                      padding:        "0.375rem 0.75rem",
                      borderRadius:   6,
                      textDecoration: "none",
                      border:         "1px solid rgba(255,255,255,.1)",
                      flexShrink:     0,
                    }}
                  >
                    <Download style={{ width: 13, height: 13 }} />
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Footer link ───────────────────────────────────────────────────── */}
        <Link
          to="/"
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            8,
            marginTop:      24,
            fontSize:       ".875rem",
            color:          "rgba(255,255,255,.8)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Send your own transfer
        </Link>
      </div>
    </Shell>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  const getAds = useServerFn(listActiveAdsSigned);
  const { ads, status: adsStatus } = useLiveAds(getAds);
  const ad = useAdRotator(ads, 30_000) ?? FALLBACK_AD;

  return (
    <div
      style={{
        minHeight: "100vh",
        color:     "#fff",
        position:  "relative",
        overflow:  "hidden",
      }}
    >
      <AdBackdrop ad={ad} />

      {/* Ads status indicator — positioned with a wrapper to avoid className */}
      <div
        style={{
          position: "fixed",
          bottom:   12,
          left:     12,
          zIndex:   30,
        }}
      >
        <AdsSyncStatusIndicator status={adsStatus} />
      </div>

      <div
        style={{
          position:      "relative",
          zIndex:        10,
          minHeight:     "100vh",
          display:       "flex",
          flexDirection: "column",
        }}
      >
        <SiteHeader />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
