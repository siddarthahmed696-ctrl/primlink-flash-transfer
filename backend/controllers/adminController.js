const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const { signAdminToken } = require("../middleware/auth");

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const admin = await Admin.findByEmail(email);
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAdminToken(admin);
  res.json({ token, admin: { id: admin.id, email: admin.email } });
};

exports.me = (req, res) => {
  res.json({ id: req.admin.sub, email: req.admin.email, role: "admin" });
};
