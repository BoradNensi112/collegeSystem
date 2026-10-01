const express = require("express");
const Assignment = require("../controller/assignment");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const assignmentUploadDir = path.join("uploads", "assignments");
const submissionUploadDir = path.join("uploads", "submissions");

if (!fs.existsSync(assignmentUploadDir)) {
  fs.mkdirSync(assignmentUploadDir, { recursive: true });
}

if (!fs.existsSync(submissionUploadDir)) {
  fs.mkdirSync(submissionUploadDir, { recursive: true });
}

const allowedExt = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".zip",
  ".rar",
  ".png",
  ".jpg",
  ".jpeg",
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only pdf, doc, docx, ppt, pptx, zip, rar, png, jpg, jpeg files are allowed"
      )
    );
  }
};

const makeSafeFileName = (originalname) => {
  const ext = path.extname(originalname);
  const base = path.basename(originalname, ext).replace(/[^\w\-]+/g, "_");
  return `${Date.now()}_${base}${ext}`;
};

const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assignmentUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, makeSafeFileName(file.originalname));
  },
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, submissionUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, makeSafeFileName(file.originalname));
  },
});

const uploadSubmission = multer({
  storage: submissionStorage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post("/Aadd", uploadAssignment.single("file"), Assignment.postAssignAdd);
router.post("/Aupdate", uploadAssignment.single("file"), Assignment.postUpdate);
router.post("/update", uploadAssignment.single("file"), Assignment.postUpdate);

router.post("/postViewData", Assignment.postViewData);
router.post("/postOneData", Assignment.postOneData);
router.post("/delete", Assignment.postDelete);
router.post("/total-assignments", Assignment.postTotalAssignments);

router.post("/submit", uploadSubmission.single("file"), Assignment.postSubmitAssignment);
router.post("/submitted-list", Assignment.postViewSubmittedData);
router.post("/submitted-by-student", Assignment.postViewSubmittedByStudent);
router.post("/submitted-by-assignment", Assignment.postViewSubmittedByAssignment);

module.exports = router;