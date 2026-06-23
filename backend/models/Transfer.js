const { pool } = require("../config/db");

async function create({ id, shareCode, title, message, sender_email, recipient_email, total_size, expires_at }) {
  await pool.query(
    `INSERT INTO transfers (id, share_code, title, message, sender_email, recipient_email, total_size, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, shareCode, title || null, message || null, sender_email || null, recipient_email || null, total_size, expires_at]
  );
}

async function findById(id) {
  const [rows] = await pool.query("SELECT id, total_size FROM transfers WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

async function findByShareCode(code) {
  const [rows] = await pool.query(
    `SELECT id, share_code, title, message, sender_email, total_size, download_count, created_at, expires_at
     FROM transfers WHERE share_code = ? LIMIT 1`,
    [code]
  );
  return rows[0] || null;
}

async function incrementDownload(code) {
  await pool.query(
    "UPDATE transfers SET download_count = download_count + 1 WHERE share_code = ?",
    [code]
  );
}

async function insertFiles(rows) {
  if (!rows.length) return;
  await pool.query(
    `INSERT INTO transfer_files (id, transfer_id, file_name, file_size, content_type, storage_path) VALUES ?`,
    [rows]
  );
}

async function filesForTransfer(transferId) {
  const [rows] = await pool.query(
    `SELECT id, file_name, file_size, content_type FROM transfer_files WHERE transfer_id = ? ORDER BY created_at`,
    [transferId]
  );
  return rows;
}

async function fileForDownload(code, fileId) {
  const [rows] = await pool.query(
    `SELECT f.file_name, f.content_type, f.storage_path, f.file_size, t.expires_at
     FROM transfer_files f JOIN transfers t ON t.id = f.transfer_id
     WHERE f.id = ? AND t.share_code = ? LIMIT 1`,
    [fileId, code]
  );
  return rows[0] || null;
}

module.exports = {
  create,
  findById,
  findByShareCode,
  incrementDownload,
  insertFiles,
  filesForTransfer,
  fileForDownload,
};
