// controller/auth.controller.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");


const toStr = (v) => (v === undefined || v === null ? "" : String(v));
const trim = (v) => toStr(v).trim();

const toNull = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  if (typeof v === "number" && Number.isNaN(v)) return null;
  return v;
};

const toIntOrNull = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
};

const JWT_SECRET = process.env.JWT_SECRET || "nenuborad@112"; 
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// REGISTER
exports.register = async (req, res) => {
  try {
    const body = req.body || {};
    console.log("REGISTER BODY:", body);

    const user_type = trim(body.user_type || body.userType || body.role).toLowerCase();
    if (!["student", "faculty", "admin"].includes(user_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user_type. Use student/faculty/admin",
      });
    }

    const first_name = trim(body.first_name);
    const last_name = trim(body.last_name);
    const user_name = trim(body.user_name);
    const email = trim(body.email).toLowerCase();
    const password = toStr(body.password);

    if (!first_name) return res.status(400).json({ success: false, message: "First name required" });
    if (!last_name) return res.status(400).json({ success: false, message: "Last name required" });
    if (!user_name) return res.status(400).json({ success: false, message: "Username required" });
    if (!email) return res.status(400).json({ success: false, message: "Email required" });
    if (!password) return res.status(400).json({ success: false, message: "Password required" });
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const course = toNull(trim(body.course));
    const enrollment = toNull(trim(body.enrollment));
    const semVal = user_type === "student" ? toIntOrNull(body.sem) : null;

    const department = toNull(trim(body.department));
    const qualification = toNull(trim(body.qualification));
    const expVal = user_type === "faculty" ? toIntOrNull(body.experience) : null;

    if (user_type === "student") {
      if (!course) return res.status(400).json({ success: false, message: "Course required" });
      if (semVal === null) return res.status(400).json({ success: false, message: "Semester required" });
      if (semVal < 1 || semVal > 8) {
        return res.status(400).json({ success: false, message: "Semester must be between 1 and 8" });
      }
      if (!enrollment) return res.status(400).json({ success: false, message: "Enrollment required" });
    }

    if (user_type === "faculty") {
      if (!department) return res.status(400).json({ success: false, message: "Department required" });
      if (!qualification) return res.status(400).json({ success: false, message: "Qualification required" });
      if (expVal === null) return res.status(400).json({ success: false, message: "Experience required" });
      if (expVal < 0 || expVal > 60) {
        return res.status(400).json({ success: false, message: "Experience must be between 0 and 60" });
      }
    }

    // duplicates
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) return res.status(409).json({ success: false, message: "Email already exists" });

    const usernameExists = await User.findOne({ where: { user_name } });
    if (usernameExists) return res.status(409).json({ success: false, message: "Username already exists" });

    if (user_type === "student") {
      const enrollExists = await User.findOne({ where: { enrollment } });
      if (enrollExists) return res.status(409).json({ success: false, message: "Enrollment already exists" });
    }

    const payload = {
      first_name,
      last_name,
      user_name,
      email,
      password: await bcrypt.hash(password, 10),
      user_type,

      course: user_type === "student" ? course : null,
      sem: user_type === "student" ? semVal : null,
      enrollment: user_type === "student" ? enrollment : null,
      father_name: user_type === "student" ? toNull(trim(body.father_name)) : null,
      father_mobile: user_type === "student" ? toNull(trim(body.father_mobile)) : null,

      mobile: toNull(trim(body.mobile)),
      dob: toNull(trim(body.dob)),

      department: user_type === "faculty" ? department : null,
      qualification: user_type === "faculty" ? qualification : null,
      experience: user_type === "faculty" ? String(expVal) : null,
    };

    const created = await User.create(payload);

    return res.status(201).json({
      success: true,
      message: "✅ Account created successfully!",
      user: {
        user_id: created.user_id,
        user_type: created.user_type,
        user_name: created.user_name,
        email: created.email,
      },
    });
  } catch (err) {
    console.log("REGISTER ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

//  LOGIN 
exports.login = async (req, res) => {
  try {
    const u = req.user; 
    if (!u) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        user_id: u.user_id,
        email: u.email,
        user_type: u.user_type,
        user_name: u.user_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      message: "✅ Login successful",
      token,
      user: {
        user_id: u.user_id,
        user_type: u.user_type,
        user_name: u.user_name,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        mobile: u.mobile,
        dob: u.dob,
        course: u.course,
        sem: u.sem,
        enrollment: u.enrollment,
        father_name: u.father_name,
        father_mobile: u.father_mobile,
        department: u.department,
        qualification: u.qualification,
        experience: u.experience,
      },
    });
  } catch (err) {
    console.log("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

// In-memory OTP storage
const otpStore = new Map();

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const email = trim(req.body?.email).toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes

    console.log(`🔑 PASSWORD RESET OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: `OTP generated successfully. (OTP for testing: ${otp})`,
      otp, // included for seamless local development
    });
  } catch (err) {
    console.log("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  try {
    const email = trim(req.body?.email).toLowerCase();
    const otp = trim(req.body?.otp);
    const newPassword = toStr(req.body?.new_password || req.body?.newPassword || req.body?.password);

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const storedData = otpStore.get(email);
    // Allow matching OTP or generic master OTP "123456" for convenience in testing
    const isValidOtp = (storedData && storedData.otp === otp && storedData.expiresAt > Date.now()) || otp === "123456";

    if (!isValidOtp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { email } });

    otpStore.delete(email);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in.",
    });
  } catch (err) {
    console.log("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};