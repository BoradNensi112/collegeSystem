const Student = require("../models/user");
const bcrypt = require("bcryptjs");

const hashPasswordIfNeeded = async (pwd) => {
  if (!pwd || String(pwd).trim() === "") return "";
  const s = String(pwd);
  if (s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$")) {
    return s;
  }
  return await bcrypt.hash(s, 10);
};

// INSERT
exports.studentInsert = async (body) => {
  try {
    const data = body;
    const plainPwd = data.password || "password123";
    const hashedPassword = await hashPasswordIfNeeded(plainPwd);

    const db_status = await Student.create({
      first_name: data.first_name,
      last_name: data.last_name,
      user_name: data.user_name,
      email: data.email,
      password: hashedPassword,
      course: data.course,
      sem: data.sem,
      enrollment: data.enrollment,
      mobile: data.mobile,
      father_name: data.father_name,
      father_mobile: data.father_mobile,
      dob: data.dob,
      user_type: "student", // ✅ force student
      department: data.department,
      qualification: data.qualification,
      experience: data.experience,
    });

    return db_status;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// VIEW ALL
exports.viewStudentData = async () => {
  try {
    const data = await Student.findAll({
      where: { user_type: "student" }, 
      order: [["user_id", "DESC"]],
    });
    return data;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// VIEW ONE
exports.viewStudentOneData = async (id) => {
  try {
    const data = await Student.findOne({
      where: {
        user_id: id,
        user_type: "student", 
      },
    });
    return data;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// DELETE
exports.deleteData = async (id) => {
  try {
    const data = await Student.destroy({
      where: {
        user_id: id,
        user_type: "student", 
      },
    });
    return data;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// UPDATE
exports.StudentUpdate = async (body) => {
  try {
    const data = body;

    const updatePayload = {
      first_name: data.first_name,
      last_name: data.last_name,
      user_name: data.user_name,
      email: data.email,
      course: data.course,
      sem: data.sem,
      enrollment: data.enrollment,
      mobile: data.mobile,
      father_name: data.father_name,
      father_mobile: data.father_mobile,
      dob: data.dob,
      user_type: "student", 
      department: data.department,
      qualification: data.qualification,
      experience: data.experience,
    };

    // ✅ password only update if value comes
    if (data.password && String(data.password).trim() !== "") {
      updatePayload.password = await hashPasswordIfNeeded(data.password);
    }

    const result = await Student.update(updatePayload, {
      where: {
        user_id: data.user_id || data.student_id || data.id,
        user_type: "student", 
      },
    });

    return result;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// COUNT
exports.getStudentCount = async () => {
  try {
    const totalStudents = await Student.count({
      where: { user_type: "student" }, 
    });
    return totalStudents;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};