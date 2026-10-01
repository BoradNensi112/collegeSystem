const express = require("express");
const NoticeController = require("../controller/notice");

const router = express.Router();

router.post("/postNoticeData", NoticeController.postNoticeData);
router.post("/create", NoticeController.create);
router.post("/update", NoticeController.update);
router.post("/delete", NoticeController.remove);
router.post("/toggle", NoticeController.toggle);
router.post("/one", NoticeController.one);

module.exports = router;