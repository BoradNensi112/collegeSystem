const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const MaterialController = require("../controller/material");

const materialDir = path.join(process.cwd(), "uploads", "material");
fs.mkdirSync(materialDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, materialDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path
      .basename(file.originalname || "file", ext)
      .replace(/\s+/g, "_")
      .replace(/[^\w.\-]/g, "");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    ".pdf",
    ".ppt",
    ".pptx",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".zip",
    ".rar",
    ".mp4",
    ".mkv",
    ".txt",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".html",
    ".css",
    ".js"
  ];

  const ext = path.extname(file.originalname || "").toLowerCase();
  if (allowed.length && !allowed.includes(ext)) {
    return cb(new Error(`Invalid file type: ${ext}`), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post("/Madd", upload.single("file"), MaterialController.postMaterialAdd);
router.post("/postMaterialData", MaterialController.postMaterialData);
router.post("/postViewData", MaterialController.postMaterialData);
router.get("/list", MaterialController.postMaterialData);
router.post("/list", MaterialController.postMaterialData);
router.post("/postOneData", MaterialController.postOneData);
router.post("/delete", MaterialController.postDelete);
router.post("/update", upload.single("file"), MaterialController.postUpdate);
router.post("/count", MaterialController.postSemesterSummary);

module.exports = router;