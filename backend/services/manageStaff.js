const ManageStaff = require("../models/user");
const { Sequelize } = require("sequelize");
const bcrypt = require("bcryptjs");

const hashPasswordIfNeeded = async (pwd) => {
  if (!pwd || String(pwd).trim() === "") return "";
  const s = String(pwd);
  if (s.startsWith("$2a$") || s.startsWith("$2b$") || s.startsWith("$2y$")) {
    return s;
  }
  return await bcrypt.hash(s, 10);
};

// Add Faculty
exports.manageStaffInsert = async (body) => {
  try {
    const data = body;
    const plainPwd = data.password || "password123";
    const hashedPassword = await hashPasswordIfNeeded(plainPwd);

    const db_status = await ManageStaff.create({
      first_name: data.first_name,
      last_name: data.last_name,
      user_name: data.user_name,
      email: data.email,
      password: hashedPassword,
      course: data.course || null,
      sem: data.sem || null,
      enrollment: data.enrollment || null,
      mobile: data.mobile,
      father_name: data.father_name || null,
      father_mobile: data.father_mobile || null,
      dob: data.dob || null,
      user_type: "faculty",
      department: data.department || null,
      qualification: data.qualification || null,
      experience: data.experience || null,
    });

    return db_status;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// View All Faculty
exports.viewStaffData = async () => {
  try {
    const data = await ManageStaff.findAll({
      where: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("user_type")),
        "faculty"
      ),
      order: [["user_id", "DESC"]],
    });

    return data;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// View One Faculty
exports.viewStaffOneData = async (id) => {
  try {
    const data = await ManageStaff.findOne({
      where: {
        user_id: id,
        [Sequelize.Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("user_type")),
            "faculty"
          ),
        ],
      },
    });

    return data;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// Delete Faculty
exports.deleteData = async (id) => {
  try {
    const data = await ManageStaff.destroy({
      where: {
        user_id: id,
        [Sequelize.Op.and]: [
          Sequelize.where(
            Sequelize.fn("LOWER", Sequelize.col("user_type")),
            "faculty"
          ),
        ],
      },
    });

    return data;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// Update Faculty
exports.StaffUpdate = async (body) => {
  try {
    const data = body;
    const id =
      data.user_id ||
      data.staff_id ||
      data.id ||
      data._id ||
      data.staffId ||
      data.faculty_id;

    const updatePayload = {
      first_name: data.first_name,
      last_name: data.last_name,
      user_name: data.user_name,
      email: data.email,
      course: data.course || null,
      sem: data.sem || null,
      enrollment: data.enrollment || null,
      mobile: data.mobile,
      father_name: data.father_name || null,
      father_mobile: data.father_mobile || null,
      dob: data.dob || null,
      user_type: "faculty",
      department: data.department || null,
      qualification: data.qualification || null,
      experience: data.experience || null,
    };

    if (data.password && String(data.password).trim() !== "") {
      updatePayload.password = await hashPasswordIfNeeded(data.password);
    }

    const result = await ManageStaff.update(
      updatePayload,
      {
        where: {
          user_id: id,
          [Sequelize.Op.and]: [
            Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("user_type")),
              "faculty"
            ),
          ],
        },
      }
    );

    return result;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// Count Faculty
exports.totalStaff = async () => {
  try {
    const total = await ManageStaff.count({
      where: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("user_type")),
        "faculty"
      ),
    });

    return total;
  } catch (err) {
    const error = new Error(err.message || err);
    error.statusCode = 500;
    throw error;
  }
};