const express = require("express");
const router = express.Router();
const profileController = require("../controller/profile");
const { optionalAuth } = require("../middleware/auth");

router.get("/faculty/:id", profileController.getFacultyProfile);
router.post("/faculty/:id", profileController.getFacultyProfile);
router.get("/student/:id", profileController.getStudentProfile);
router.post("/student/:id", profileController.getStudentProfile);
router.get("/profile/:id", profileController.getFacultyProfile);
router.post("/profile/:id", profileController.getFacultyProfile);
router.get("/my", optionalAuth, profileController.getMyProfile);
router.post("/my", optionalAuth, profileController.getMyProfile);
router.post("/update", optionalAuth, profileController.updateProfile);
router.post("/change-password", optionalAuth, profileController.changePassword);

module.exports = router;