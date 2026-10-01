const express = require("express");
const router = express.Router();
const facultyDashboardController = require("../controller/facultyDashboard");

router.post("/overview", facultyDashboardController.getOverview);
router.post("/today", facultyDashboardController.getTodayClasses);
router.post("/submissions", facultyDashboardController.getSubmissions);
router.post("/notices", facultyDashboardController.getNotices);

module.exports = router;
