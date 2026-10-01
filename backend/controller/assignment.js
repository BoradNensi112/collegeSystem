const Assignment = require("../services/assignment");

//  ADD ASSIGNMENT 
exports.postAssignAdd = async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (req.file) {
      body.file_url = `/uploads/assignments/${req.file.filename}`;
      body.file_name = req.file.originalname;
    }

    body.sem = body.sem ? Number(body.sem) : null;
    body.total_marks = body.total_marks ? Number(body.total_marks) : null;

    const db = await Assignment.assignmentInsert(body);

    return res.status(200).json({
      success: true,
      message: "Assignment added successfully",
      data: db,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  VIEW ALL ASSIGNMENTS 
exports.postViewData = async (req, res, next) => {
  try {
    const data = await Assignment.viewAssignData();

    return res.status(200).json({
      success: true,
      message: "Assignments fetched successfully",
      data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  VIEW ONE ASSIGNMENT 
exports.postOneData = async (req, res, next) => {
  try {
    const id = req.body.id || req.body.assignment_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "assignment_id or id is required",
      });
    }

    const data = await Assignment.viewAssignOneData(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment fetched successfully",
      data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  DELETE ASSIGNMENT 
exports.postDelete = async (req, res, next) => {
  try {
    const id = req.body.id || req.body.assignment_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "assignment_id or id is required",
      });
    }

    const data = await Assignment.deleteData(id);

    return res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
      data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  UPDATE ASSIGNMENT 
exports.postUpdate = async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (!body.assignment_id && !body.id) {
      return res.status(400).json({
        success: false,
        message: "assignment_id or id is required",
      });
    }

    body.assignment_id = body.assignment_id || body.id;

    if (req.file) {
      body.file_url = `/uploads/assignments/${req.file.filename}`;
      body.file_name = req.file.originalname;
    }

    body.sem = body.sem ? Number(body.sem) : null;
    body.total_marks = body.total_marks ? Number(body.total_marks) : null;

    const data = await Assignment.update(body);

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  TOTAL ASSIGNMENTS 
exports.postTotalAssignments = async (req, res, next) => {
  try {
    const total = await Assignment.totalAssignments();

    return res.status(200).json({
      success: true,
      message: "Total assignments fetched successfully",
      ...total,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  SUBMIT ASSIGNMENT 
exports.postSubmitAssignment = async (req, res, next) => {
  try {
    const body = { ...req.body };

    if (!body.assignment_id || !body.student_id) {
      return res.status(400).json({
        success: false,
        message: "assignment_id and student_id required",
      });
    }

    if (req.file) {
      body.file_url = `/uploads/submissions/${req.file.filename}`;
      body.file_name = req.file.originalname;
    }

    const data = await Assignment.submitAssignment(body);

    return res.status(200).json({
      success: true,
      message: "Assignment submitted successfully",
      data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  VIEW ALL SUBMISSIONS 
exports.postViewSubmittedData = async (req, res, next) => {
  try {
    const data = await Assignment.viewSubmittedAssignments();

    return res.status(200).json({
      success: true,
      message: "Submitted assignments fetched successfully",
      data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  VIEW STUDENT SUBMISSIONS 
exports.postViewSubmittedByStudent = async (req, res, next) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "student_id is required",
      });
    }

    const data = await Assignment.viewSubmittedAssignmentsByStudent(student_id);

    return res.status(200).json({
      success: true,
      message: "Student submitted assignments fetched successfully",
      data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  VIEW SUBMISSIONS BY ASSIGNMENT 
exports.postViewSubmittedByAssignment = async (req, res, next) => {
  try {
    const { assignment_id } = req.body;

    if (!assignment_id) {
      return res.status(400).json({
        success: false,
        message: "assignment_id is required",
      });
    }

    const data = await Assignment.viewSubmittedAssignmentsByAssignment(assignment_id);

    return res.status(200).json({
      success: true,
      message: "Assignment submissions fetched successfully",
      data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};