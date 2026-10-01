const express = require("express");
const router = express.Router();

const controller = require("../controller/feedbackController");
const { requireAuth } = require("../middleware/auth");

// Student
router.post("/active-session", requireAuth, controller.getActiveSession);
router.post("/submit", requireAuth, controller.submitFeedback);

// Admin
router.post("/session/create", requireAuth, controller.createSession);
router.post("/session/update/:session_id", requireAuth, controller.updateSession);
router.post("/session/list", requireAuth, controller.getAllSessions);

router.post("/admin/list", requireAuth, controller.getFeedbackList);
router.post("/admin/faculty-summary", requireAuth, controller.getFacultySummary);
router.post("/admin/college-summary", requireAuth, controller.getCollegeSummary);
router.post("/admin/dashboard-summary", requireAuth, controller.getDashboardSummary);

module.exports = router;