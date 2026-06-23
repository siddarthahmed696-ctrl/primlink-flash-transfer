const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Transfer = require("../models/Transfer");
const { UPLOAD_DIR } = require("../config/storage");
const { MAX_MB, MAX_BYTES } = require("../middleware/upload");

const EXPIRY_DAYS = Number(process.env.TRANSFER_EXPIRY_DAYS || 7);

// ── Create transfer
exports.create = async (req, res) => {
  const { title, message, sender_email, recipient_email, total_size } = req.body || {};
  const size = Number(total_size || 0);
  if (size < 0 || size > MAX_BYTES) {
    return res.status(413).json({ error: `Free transfers are limited to ${MAX_MB} MB` });
  }

  const id = crypto.randomUUID();
  const shareCode = crypto.randomBytes(8).toString("hex");
  const expires_at = new Date(Date.now() + EXPIRY_DAYS * 86400 * 1000);

  await Transfer.create({ id, shareCode, title, message, sender_email, recipient_email, total_size: size, expires_at });
  res.json({ id, share_code: shareCode });
};

// ── Upload files into transfer
exports.uploadFiles = async (req, res) => {
  const transferId = req.params.id;
  const transfer = await Transfer.findById(transferId);
  if (!transfer) return res.status(404).json({ error: "Transfer not found" });

  const files = req.files || [];
  const totalNew = files.reduce((s, f) => s + f.size, 0);
  if (totalNew > MAX_BYTES) return res.status(413).json({ error: `Free transfers are limited to ${MAX_MB} MB` });

  const rows = files.map((f) => [
    crypto.randomUUID(),
    transferId,
    f.originalname,
    f.size,
    f.mimetype || null,
    path.relative(UPLOAD_DIR, f.path),
  ]);
  await Transfer.insertFiles(rows);
  res.json({ ok: true, count: rows.length });
};

// ── Public lookup by share code
exports.lookup = async (req, res) => {
  const transfer = await Transfer.findByShareCode(req.params.code);
  if (!transfer) return res.status(404).json({ error: "Not found" });
  if (new Date(transfer.expires_at) < new Date()) return res.status(410).json({ error: "Expired" });

  const files = await Transfer.filesForTransfer(transfer.id);
  res.json({ transfer, files });
};

// RFC 5987 — safe filename for Content-Disposition (UTF-8 + ASCII fallback)
function contentDisposition(fileName) {
  const safe = (fileName || "download").replace(/[\r\n"]/g, "_");
  const ascii = safe.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(safe).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

// ── Download a single file (HEAD + GET, with Range / resume support)
exports.download = async (req, res) => {
  const { code, fileId } = req.params;
  const row = await Transfer.fileForDownload(code, fileId);
  if (!row) return res.status(404).json({ error: "Not found" });
  if (new Date(row.expires_at) < new Date()) return res.status(410).json({ error: "Expired" });

  const filePath = path.join(UPLOAD_DIR, row.storage_path);
  let stat;
  try { stat = fs.statSync(filePath); } catch {
    return res.status(404).json({ error: "File missing" });
  }

  const total = stat.size;
  const mime = row.content_type || "application/octet-stream";
  const range = req.headers.range;

  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Disposition", contentDisposition(row.file_name));
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "no-store");

  // HEAD: headers only (browser/manager use this to check resume support + size)
  if (req.method === "HEAD") {
    res.setHeader("Content-Length", total);
    return res.status(200).end();
  }

  // Range request → 206 Partial Content (download resume / streaming)
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!m) {
      res.setHeader("Content-Range", `bytes */${total}`);
      return res.status(416).end();
    }
    let start = m[1] ? parseInt(m[1], 10) : 0;
    let end = m[2] ? parseInt(m[2], 10) : total - 1;
    if (isNaN(start) || isNaN(end) || start > end || end >= total) {
      res.setHeader("Content-Range", `bytes */${total}`);
      return res.status(416).end();
    }
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${total}`);
    res.setHeader("Content-Length", end - start + 1);
    return fs.createReadStream(filePath, { start, end }).pipe(res);
  }

  // Full download
  res.setHeader("Content-Length", total);
  Transfer.incrementDownload(code).catch(() => {});
  fs.createReadStream(filePath).pipe(res);
};
