const { pool } = require("../config/db");

async function findByEmail(email) {
  const [rows] = await pool.query(
    "SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function upsert(id, email, passwordHash) {
  await pool.query(
    `INSERT INTO admins (id, email, password_hash) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [id, email, passwordHash]
  );
}

module.exports = { findByEmail, upsert };
