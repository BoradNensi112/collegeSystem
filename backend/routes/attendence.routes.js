const express = require("express");
const Attendence = require("../controller/attendence");

const router = express.Router();

router.post("/students", Attendence.getStudents);
router.post("/Aadd", Attendence.postAttendenceAdd);
router.post("/saveOrUpdateDaily", Attendence.postSaveOrUpdateDailyAttendance);
router.post("/postAttendData", Attendence.postAttendData);
router.post("/postAttendByDateAndClass", Attendence.postAttendByDateAndClass);
router.post("/postAttendByStudent", Attendence.postAttendByStudent);
router.post("/postAttendByMonth", Attendence.postAttendByMonth);
router.post("/viewOne", Attendence.viewOne);
router.post("/delete", Attendence.postDelete);
router.post("/update", Attendence.postUpdate);

module.exports = router;