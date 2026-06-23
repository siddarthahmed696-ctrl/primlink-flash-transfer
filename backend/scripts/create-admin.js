// Usage: node scripts/create-admin.js admin@example.com SuperSecret123
require("dotenv").config();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const { pool } = require("../config/db");

(async () => {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error("Usage: node scripts/create-admin.js <email> <password>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await Admin.upsert(crypto.randomUUID(), email, hash);
  await pool.end();
  console.log(`✅ Admin ready: ${email}`);
})().catch((e) => { console.error(e); process.exit(1); });
