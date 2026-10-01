const express = require("express");
const router = express.Router();
const adminDashboardController = require("../controller/adminDashboard");

router.get("/overview", adminDashboardController.getAdminOverview);
router.post("/overview", adminDashboardController.getAdminOverview);

module.exports = router;
