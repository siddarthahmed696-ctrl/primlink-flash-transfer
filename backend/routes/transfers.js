const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/transferController");
const { uploadTransfer } = require("../middleware/upload");

const router = express.Router();
const createLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
const downloadLimiter = rateLimit({ windowMs: 60 * 1000, max: 240 });

router.post("/", createLimiter, ctrl.create);
router.post("/:id/files", uploadTransfer.array("files", 50), ctrl.uploadFiles);
router.get("/by-code/:code", ctrl.lookup);

// Download — supports GET and HEAD with Range / resume
router.get("/by-code/:code/file/:fileId", downloadLimiter, ctrl.download);
router.head("/by-code/:code/file/:fileId", ctrl.download);

module.exports = router;
