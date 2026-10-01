const express = require("express");
const router = express.Router();

const leaveRequestController = require("../controller/leaveRequest");

router.post("/create", leaveRequestController.postLeaveRequestCreate);
router.post("/apply", leaveRequestController.postLeaveRequestCreate);
router.post("/list", leaveRequestController.postLeaveRequestList);
router.get("/list", leaveRequestController.postLeaveRequestList);
router.post("/findOne", leaveRequestController.postLeaveRequestFindOne);
router.post("/update", leaveRequestController.postLeaveRequestUpdate);
router.post("/delete", leaveRequestController.postLeaveRequestDelete);
router.post("/status", leaveRequestController.postLeaveRequestStatus);

// Faculty specific aliases
router.post("/faculty/list", leaveRequestController.postLeaveRequestList);
router.get("/faculty/list", leaveRequestController.postLeaveRequestList);
router.post("/faculty/create", leaveRequestController.postLeaveRequestCreate);
router.post("/faculty/update", leaveRequestController.postLeaveRequestUpdate);
router.post("/faculty/delete", leaveRequestController.postLeaveRequestDelete);
router.post("/faculty/status", leaveRequestController.postLeaveRequestStatus);

module.exports = router;