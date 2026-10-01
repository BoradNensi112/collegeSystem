const Attendence = require("../models/attendence");
const { Op } = require("sequelize");

// insert single attendance
exports.attendenceInsert = async (body) => {
  try {
    return await Attendence.create({
      student_id: body.student_id,
      roll_no: body.roll_no || null,
      name: body.name || "",
      department_id: body.department_id || 0,
      course: body.course || "",
      semester: Number(body.semester) || 1,
      attendance_date: body.attendance_date,
      status: Number(body.status) || 1,
    });
  } catch (err) {
    console.log("attendenceInsert error:", err);
    throw new Error(err.message || err);
  }
};

// view by id
exports.viewAttendOneData = async (id) => {
  try {
    return await Attendence.findOne({
      where: { attendence_id: id },
    });
  } catch (err) {
    console.log("viewAttendOneData error:", err);
    throw new Error(err.message || err);
  }
};

// delete
exports.deleteData = async (id) => {
  try {
    return await Attendence.destroy({
      where: { attendence_id: id },
    });
  } catch (err) {
    console.log("deleteData error:", err);
    throw new Error(err.message || err);
  }
};

// update
exports.AttenUpdate = async (body) => {
  try {
    return await Attendence.update(
      {
        student_id: body.student_id,
        roll_no: body.roll_no || null,
        name: body.name || "",
        department_id: body.department_id || 0,
        course: body.course || "",
        semester: Number(body.semester) || 1,
        attendance_date: body.attendance_date,
        status: Number(body.status) || 1,
      },
      {
        where: { attendence_id: body.attendence_id },
      }
    );
  } catch (err) {
    console.log("AttenUpdate error:", err);
    throw new Error(err.message || err);
  }
};

// date wise + course wise + semester wise
exports.viewAttendByDateAndClass = async (body) => {
  try {
    const whereCondition = {
      attendance_date: body.attendance_date,
    };

    if (body.course) {
      const courseStr = String(body.course).trim();
      if (courseStr.toUpperCase().includes("BTECH") || courseStr.toUpperCase().includes("B.TECH")) {
        whereCondition.course = {
          [Op.or]: [
            { [Op.iLike]: "%B.Tech%" },
            { [Op.iLike]: "%BTech%" },
            { [Op.iLike]: "%BTECH%" },
          ],
        };
      } else {
        whereCondition.course = { [Op.iLike]: `%${courseStr}%` };
      }
    }

    if (body.semester) {
      whereCondition.semester = Number(body.semester);
    }

    return await Attendence.findAll({
      where: whereCondition,
      order: [["student_id", "ASC"]],
    });
  } catch (err) {
    console.log("viewAttendByDateAndClass error:", err);
    throw new Error(err.message || err);
  }
};

// student wise
exports.viewAttendByStudent = async (student_id) => {
  try {
    return await Attendence.findAll({
      where: { student_id },
      order: [["attendance_date", "DESC"]],
    });
  } catch (err) {
    console.log("viewAttendByStudent error:", err);
    throw new Error(err.message || err);
  }
};

// month/date range
exports.viewAttendByMonth = async (body) => {
  try {
    const { student_id, from, to } = body;
    const whereCondition = {};

    if (student_id) {
      whereCondition.student_id = Number(student_id);
    }

    if (from && to) {
      whereCondition.attendance_date = {
        [Op.between]: [from, to],
      };
    } else if (from) {
      whereCondition.attendance_date = {
        [Op.gte]: from,
      };
    } else if (to) {
      whereCondition.attendance_date = {
        [Op.lte]: to,
      };
    }

    return await Attendence.findAll({
      where: whereCondition,
      order: [
        ["attendance_date", "ASC"],
        ["attendence_id", "ASC"],
      ],
    });
  } catch (err) {
    console.log("viewAttendByMonth error:", err);
    throw new Error(err.message || err);
  }
};

// upsert save/update daily attendance
exports.saveOrUpdateDailyAttendance = async (body) => {
  try {
    const attendance_date = body.attendance_date;
    const attendance = body.attendance || [];

    if (!attendance_date) throw new Error("attendance_date is required");
    if (!Array.isArray(attendance) || attendance.length === 0) {
      throw new Error("attendance array is required");
    }

    const results = [];

    for (const item of attendance) {
      if (!item.student_id) throw new Error("student_id is required");

      const existing = await Attendence.findOne({
        where: {
          student_id: item.student_id,
          attendance_date,
        },
      });

      const commonPayload = {
        roll_no: item.roll_no || null,
        name: item.name || "",
        department_id: item.department_id || 0,
        course: item.course || "",
        semester: Number(item.semester) || 1,
        status: Number(item.status) || 1,
      };

      if (existing) {
        await Attendence.update(commonPayload, {
          where: { attendence_id: existing.attendence_id },
        });

        results.push({
          type: "updated",
          student_id: item.student_id,
        });
      } else {
        await Attendence.create({
          student_id: item.student_id,
          attendance_date,
          ...commonPayload,
        });

        results.push({
          type: "created",
          student_id: item.student_id,
        });
      }
    }

    return results;
  } catch (err) {
    console.log("saveOrUpdateDailyAttendance error:", err);
    throw new Error(err.message || err);
  }
};