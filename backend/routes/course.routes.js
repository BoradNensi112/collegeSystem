const express = require("express");
const controller = require("../controller/course");

const router = express.Router();

router.post("/create", controller.create);
router.post("/list", controller.list);
router.post("/one", controller.one);
router.post("/update", controller.update);
router.post("/delete", controller.remove);

module.exports = router;