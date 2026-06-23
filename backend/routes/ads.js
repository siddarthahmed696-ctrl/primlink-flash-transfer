const express = require("express");
const ctrl = require("../controllers/adController");
const { requireAdmin } = require("../middleware/auth");
const { uploadAd } = require("../middleware/upload");

const router = express.Router();

router.get("/active", ctrl.listActive);
router.get("/", requireAdmin, ctrl.listAll);
router.post("/upload", requireAdmin, uploadAd.single("file"), ctrl.upload);
router.post("/", requireAdmin, ctrl.create);
router.put("/:id", requireAdmin, ctrl.update);
router.delete("/:id", requireAdmin, ctrl.remove);

module.exports = router;
