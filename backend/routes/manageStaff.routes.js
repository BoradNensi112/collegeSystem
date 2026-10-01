const express = require("express");
const ManageStaff = require("../controller/manageStaff");
const router = express.Router();

router.post("/Madd", ManageStaff.postManageStaffAdd);
router.post("/Mdelete", ManageStaff.postManageStaffDel);
router.post("/Medit", ManageStaff.postManageStaffEdit);
router.post("/Mupdate", ManageStaff.postManageStaffUp);
router.post("/postStaffData", ManageStaff.postStaffData);
router.post("/postOneData", ManageStaff.postOneData);
router.post("/delete", ManageStaff.postDelete);
router.post("/totalStaff", ManageStaff.postTotalStaff);
router.get("/list", ManageStaff.postStaffData);
router.post("/list", ManageStaff.postStaffData);

module.exports = router;