const express = require("express");
const Fees = require("../controller/fees");
const router = express.Router();

router.post("/Fadd", Fees.postFeesAdd);
router.post("/Fupdate", Fees.postFeesUpdate);
router.post("/Fdelete", Fees.postFeesDel);
router.post("/postFeesData", Fees.postFeesData);
router.post("/postOneData", Fees.postOneData);

router.post("/list", Fees.postFeesList);
router.post("/summary", Fees.postFeesSummary);
router.post("/pay", Fees.postFeesPay);
router.post("/bulkStatus", Fees.postFeesBulkStatus);
router.post("/export", Fees.postFeesExport);
router.post("/receipt", Fees.postFeesReceipt);

module.exports = router;