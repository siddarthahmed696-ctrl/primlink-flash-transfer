const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post("/login", loginLimiter, ctrl.login);
router.get("/me", requireAdmin, ctrl.me);

module.exports = router;
