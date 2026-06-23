const cors = require("cors");

const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origins.length === 0 || origins.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked"));
  },
  credentials: false,
  // download response ke liye browser ko file-name header expose karein
  exposedHeaders: ["Content-Disposition", "Content-Length", "Content-Range", "Accept-Ranges"],
});
