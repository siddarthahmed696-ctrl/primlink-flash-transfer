const { pool } = require("../config/db");

function safeJson(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
  return [];
}

function mapRow(r) { return { ...r, image_urls: safeJson(r.image_urls) }; }

async function listActive() {
  const [rows] = await pool.query(
    `SELECT id, heading, tagline, link_url, image_urls, video_url, sort_order
     FROM site_ads WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC`
  );
  return rows.map(mapRow);
}

async function listAll() {
  const [rows] = await pool.query(
    `SELECT * FROM site_ads ORDER BY sort_order ASC, created_at DESC`
  );
  return rows.map(mapRow);
}

async function create(ad) {
  await pool.query(
    `INSERT INTO site_ads (id, heading, tagline, link_url, image_urls, video_url, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [ad.id, ad.heading, ad.tagline || null, ad.link_url,
     JSON.stringify(ad.image_urls || []), ad.video_url || null,
     ad.is_active === false ? 0 : 1, Number(ad.sort_order || 0)]
  );
}

async function update(id, ad) {
  await pool.query(
    `UPDATE site_ads SET heading=?, tagline=?, link_url=?, image_urls=?, video_url=?, is_active=?, sort_order=?
     WHERE id=?`,
    [ad.heading, ad.tagline || null, ad.link_url,
     JSON.stringify(ad.image_urls || []), ad.video_url || null,
     ad.is_active ? 1 : 0, Number(ad.sort_order || 0), id]
  );
}

async function remove(id) {
  await pool.query(`DELETE FROM site_ads WHERE id = ?`, [id]);
}

module.exports = { listActive, listAll, create, update, remove };
