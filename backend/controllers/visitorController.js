const Visitor = require("../models/Visitor");

exports.heartbeat = async (req, res) => {
  const { session_id, path: pagePath } = req.body || {};
  if (!session_id || session_id.length < 8 || session_id.length > 128) {
    return res.status(400).json({ error: "invalid session_id" });
  }
  await Visitor.heartbeat(session_id, (pagePath || "").toString().slice(0, 512));
  res.json({ ok: true });
};

exports.live = async (_req, res) => {
  res.json({ count: await Visitor.liveCount() });
};
