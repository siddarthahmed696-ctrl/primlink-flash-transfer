const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
const ADS_DIR = path.join(UPLOAD_DIR, "ads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(ADS_DIR)) fs.mkdirSync(ADS_DIR, { recursive: true });

module.exports = { UPLOAD_DIR, ADS_DIR };
