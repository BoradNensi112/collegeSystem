const express = require("express");
const router = express.Router();
const summaryController = require("../controller/summary.controller");

router.post("/student", summaryController.getStudentSummary);

module.exports = router;