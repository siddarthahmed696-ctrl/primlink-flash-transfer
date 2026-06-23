module.exports = function errorHandler(err, _req, res, _next) {
  console.error("[error]", err);
  if (res.headersSent) return;
  res.status(err.status || 500).json({ error: err.message || "Server error" });
};
