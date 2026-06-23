const express = require("express");
const ctrl = require("../controllers/visitorController");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/heartbeat", ctrl.heartbeat);
router.get("/live", requireAdmin, ctrl.live);

module.exports = router;
