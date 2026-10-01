const express = require("express");
const router = express.Router();

const StudentController = require("../controller/student"); 

router.post("/Sadd", StudentController.postStudentAdd);
router.post("/postStudentData", StudentController.postStudentData);
router.post("/view-data", StudentController.postStudentData);
router.get("/view-data", StudentController.postStudentData);
router.post("/list", StudentController.postStudentData);
router.get("/list", StudentController.postStudentData);
router.post("/postOneData", StudentController.postOneData);
router.post("/delete", StudentController.postDelete);
router.post("/update", StudentController.postUpdate);
router.post("/count", StudentController.postStudentCounts);

module.exports = router;