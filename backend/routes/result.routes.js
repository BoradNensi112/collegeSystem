// routes/result.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controller/result");
const { requireAuth, optionalAuth } = require("../middleware/auth");

function requireAdmin(req, res, next) {
  const t = String(req.auth?.user_type || "").toUpperCase();
  if (t === "ADMIN") return next();
  return res.status(403).json({ success: false, message: "Admin only" });
}

router.post("/my", optionalAuth, ctrl.my); 

router.post("/list", requireAuth, requireAdmin, ctrl.list);
router.post("/summary", requireAuth, requireAdmin, ctrl.summary);
router.post("/create", requireAuth, requireAdmin, ctrl.create);
router.post("/update", requireAuth, requireAdmin, ctrl.update);
router.post("/delete", requireAuth, requireAdmin, ctrl.remove);
router.post("/one", requireAuth, requireAdmin, ctrl.one);
router.post("/togglePublish", requireAuth, requireAdmin, ctrl.togglePublish);
router.post("/bulk", requireAuth, requireAdmin, ctrl.bulk);
router.post("/send", requireAuth, requireAdmin, ctrl.send);
router.post("/export", requireAuth, requireAdmin, ctrl.exportData);
router.post("/upload-marks", ctrl.uploadMarks);
router.post("/class-marks", optionalAuth, ctrl.getClassMarks);

module.exports = router;