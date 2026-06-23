const { pool } = require("../config/db");

async function heartbeat(sessionId, pagePath) {
  await pool.query(
    `INSERT INTO visitors (session_id, path) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE path = VALUES(path), last_seen = CURRENT_TIMESTAMP`,
    [sessionId, pagePath]
  );
}

async function liveCount() {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM visitors WHERE last_seen > (NOW() - INTERVAL 90 SECOND)`
  );
  return Number(rows[0].n);
}

module.exports = { heartbeat, liveCount };
