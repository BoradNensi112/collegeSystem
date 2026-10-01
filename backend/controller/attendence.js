const Attendence = require("../services/attendence");
const User = require("../models/user");
const { Op } = require("sequelize");

exports.getStudents = async (req, res, next) => {
  try {
    const { course, semester } = req.body;

    if (!course || !semester) {
      return res.status(400).json({
        success: false,
        message: "course and semester are required",
      });
    }

    const courseStr = String(course).trim();
    let courseFilter = { [Op.iLike]: `%${courseStr}%` };
    if (courseStr.toUpperCase().includes("BTECH") || courseStr.toUpperCase().includes("B.TECH")) {
      courseFilter = {
        [Op.or]: [
          { [Op.iLike]: "%B.Tech%" },
          { [Op.iLike]: "%BTech%" },
          { [Op.iLike]: "%BTECH%" },
        ],
      };
    }

    const data = await User.findAll({
      where: {
        user_type: "student",
        course: courseFilter,
        sem: Number(semester),
      },
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "enrollment",
        "course",
        "sem",
        "department",
        "user_type",
      ],
      order: [["user_id", "ASC"]],
    });

    const formatted = data.map((u) => ({
      student_id: u.user_id,
      enrollment_no: u.enrollment || "",
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
      course: u.course || "",
      semester: u.sem || null,
      department: u.department || "",
      department_id: 0,
      status: "active",
    }));

    return res.status(200).json({
      success: true,
      message: formatted,
    });
  } catch (err) {
    console.log("getStudents error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};


// add single attendance
exports.postAttendenceAdd = async (req, res, next) => {
  try {
    const body = req.body;
    const db = await Attendence.attendenceInsert(body);

    return res.status(200).json({
      success: true,
      message: "Attendance added successfully",
      data: db,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// save or update daily attendance
exports.postSaveOrUpdateDailyAttendance = async (req, res, next) => {
  try {
    const body = req.body;
    const db = await Attendence.saveOrUpdateDailyAttendance(body);

    return res.status(200).json({
      success: true,
      message: "Daily attendance saved/updated successfully",
      data: db,
    });
  } catch (err) {
    console.log("SAVE DAILY ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

// view attendance for logged-in student only
exports.postAttendData = async (req, res, next) => {
  try {
    const { student_id, from, to } = req.body || {};
    const parsedStudentId = Number(student_id);

    if (!parsedStudentId || Number.isNaN(parsedStudentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid student_id is required",
      });
    }

    const data = await Attendence.viewAttendByMonth({
      student_id: parsedStudentId,
      from,
      to,
    });

    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    console.log("postAttendData error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

// view one attendance by id
exports.viewOne = async (req, res, next) => {
  try {
    const id = req.body.id;
    const data = await Attendence.viewAttendOneData(id);

    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// delete one attendance
exports.postDelete = async (req, res, next) => {
  try {
    const id = req.body.id;
    const data = await Attendence.deleteData(id);

    return res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// update one attendance
exports.postUpdate = async (req, res, next) => {
  try {
    const body = req.body;
    const data = await Attendence.AttenUpdate(body);

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// date wise + course wise + semester wise
exports.postAttendByDateAndClass = async (req, res, next) => {
  try {
    const body = req.body;
    const data = await Attendence.viewAttendByDateAndClass(body);

    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// student wise attendance
exports.postAttendByStudent = async (req, res, next) => {
  try {
    const student_id = req.body.student_id;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "student_id is required",
      });
    }

    const data = await Attendence.viewAttendByStudent(student_id);

    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// month/date range attendance
exports.postAttendByMonth = async (req, res, next) => {
  try {
    const body = req.body;
    const data = await Attendence.viewAttendByMonth(body);

    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};