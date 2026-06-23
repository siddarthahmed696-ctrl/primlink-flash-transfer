require("dotenv").config();
const express = require("express");
const path = require("path");

const corsMiddleware = require("./middleware/cors");
const errorHandler = require("./middleware/errorHandler");
const { ADS_DIR } = require("./config/storage");

const app = express();

// Trust Hostinger's proxy so req.ip & rate-limit work correctly
app.set("trust proxy", 1);

app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));

// Public static — ad images
app.use(
  "/files/ads",
  express.static(ADS_DIR, { maxAge: "7d", immutable: false })
);

// Health check
app.get("/health", (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// API routes
app.use("/api/admin", require("./routes/admin"));
app.use("/api/ads", require("./routes/ads"));
app.use("/api/transfers", require("./routes/transfers"));
app.use("/api/visitors", require("./routes/visitors"));

app.use(errorHandler);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`V Move You backend running on :${port}`));
