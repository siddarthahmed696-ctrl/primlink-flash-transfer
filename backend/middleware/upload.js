const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { UPLOAD_DIR, ADS_DIR } = require("../config/storage");

const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 100);
const MAX_BYTES = MAX_MB * 1024 * 1024;

// Per-transfer disk storage (folder = transfer id in URL)
const transferStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOAD_DIR, req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const adStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ADS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safe}`);
  },
});

module.exports = {
  MAX_MB,
  MAX_BYTES,
  uploadTransfer: multer({ storage: transferStorage, limits: { fileSize: MAX_BYTES } }),
  uploadAd: multer({ storage: adStorage, limits: { fileSize: 20 * 1024 * 1024 } }),
};
