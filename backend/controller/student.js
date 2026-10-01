const Student = require("../services/student");

// add
exports.postStudentAdd = async (req, res, next) => {
  try {
    const db = await Student.studentInsert(req.body);
    return res.status(200).json({
      success: true,
      message: "Student added successfully",
      data: db,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  view all
exports.postStudentData = async (req, res, next) => {
  try {
    const data = await Student.viewStudentData();
    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  view one
exports.postOneData = async (req, res, next) => {
  try {
    const id = req.body.student_id || req.body.user_id || req.body.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "student_id or id is required",
      });
    }

    const data = await Student.viewStudentOneData(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  delete
exports.postDelete = async (req, res, next) => {
  try {
    const id = req.body.student_id || req.body.user_id || req.body.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "student_id or id is required",
      });
    }

    const data = await Student.deleteData(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Student not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  update
exports.postUpdate = async (req, res, next) => {
  try {
    const user_id = req.body.user_id || req.body.student_id || req.body.id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id or student_id or id is required",
      });
    }

    const payload = {
      ...req.body,
      user_id,
    };

    const data = await Student.StudentUpdate(payload);

    if (!data || data[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found or no changes made",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};

//  count
exports.postStudentCounts = async (req, res, next) => {
  try {
    const totalStudents = await Student.getStudentCount();
    return res.status(200).json({
      success: true,
      count: totalStudents,
    });
  } catch (err) {
    err.statusCode = err.statusCode || 500;
    next(err);
  }
};