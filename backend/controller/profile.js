const User = require("../models/user");

exports.getFacultyProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await User.findOne({
      where: {
        user_id: id,
        user_type: "faculty",
      },
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "user_name",
        "email",
        "mobile",
        "department",
        "qualification",
        "experience",
        "user_type",
        "dob",
      ],
    });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Faculty profile fetched successfully",
      data: faculty,
    });
  } catch (error) {
    console.error("getFacultyProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findOne({
      where: {
        user_id: id,
        user_type: "student",
      },
      attributes: [
        "user_id",
        "first_name",
        "last_name",
        "user_name",
        "email",
        "mobile",
        "course",
        "sem",
        "enrollment",
        "father_name",
        "father_mobile",
        "dob",
        "department",
        "user_type",
      ],
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student profile fetched successfully",
      data: student,
    });
  } catch (error) {
    console.error("getStudentProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.auth?.user_id || req.body?.user_id || req.query?.user_id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required",
      });
    }

    const user = await User.findOne({
      where: { user_id: userId },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("getMyProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.auth?.user_id || req.body?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const {
      first_name,
      last_name,
      mobile,
      dob,
      father_name,
      father_mobile,
      email,
      department,
      qualification,
      experience,
      course,
      sem,
    } = req.body;

    const updates = {};
    if (first_name !== undefined) updates.first_name = String(first_name).trim();
    if (last_name !== undefined) updates.last_name = String(last_name).trim();
    if (mobile !== undefined) updates.mobile = String(mobile).trim();
    if (dob !== undefined) updates.dob = String(dob).trim();
    if (father_name !== undefined) updates.father_name = String(father_name).trim();
    if (father_mobile !== undefined) updates.father_mobile = String(father_mobile).trim();
    if (department !== undefined) updates.department = String(department).trim();
    if (qualification !== undefined) updates.qualification = String(qualification).trim();
    if (experience !== undefined) updates.experience = String(experience).trim();
    if (course !== undefined) updates.course = String(course).trim();
    if (sem !== undefined) updates.sem = Number(sem) || null;

    if (email !== undefined && String(email).trim()) {
      const emailVal = String(email).trim().toLowerCase();
      const existing = await User.findOne({
        where: {
          email: emailVal,
          user_id: { [Op.ne]: userId },
        },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      updates.email = emailVal;
    }

    await user.update(updates);

    const updatedUser = await User.findOne({
      where: { user_id: userId },
      attributes: { exclude: ["password"] },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.auth?.user_id || req.body?.user_id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findOne({ where: { user_id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect current password",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await user.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};