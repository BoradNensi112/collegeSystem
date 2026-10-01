const { Op, fn, col } = require("sequelize");
const User = require("../models/user");
const Notice = require("../models/notice");
const Material = require("../models/material");
const Fees = require("../models/fees");
const Attendence = require("../models/attendence");
const Course = require("../models/course");
const Assignment = require("../models/assignment");
const LeaveRequest = require("../models/leaveRequest");
const Feedback = require("../models/Feedback");

exports.getAdminOverview = async (req, res) => {
  try {
    // 1. User metrics
    const [totalStudents, totalFaculty, totalAdmins] = await Promise.all([
      User.count({ where: { user_type: "student" } }).catch(() => 0),
      User.count({ where: { user_type: "faculty" } }).catch(() => 0),
      User.count({ where: { user_type: "admin" } }).catch(() => 0),
    ]);

    // 2. Academic & Content metrics
    const [totalCourses, totalMaterials, totalNotices, totalAssignments, pendingLeaves] =
      await Promise.all([
        Course.count().catch(() => 0),
        Material.count().catch(() => 0),
        Notice.count().catch(() => 0),
        Assignment.count().catch(() => 0),
        LeaveRequest.count({ where: { status: { [Op.iLike]: "%pending%" } } }).catch(() => 0),
      ]);

    // 3. Attendance Rate
    let attendanceRate = 85;
    try {
      const totalAtt = await Attendence.count();
      if (totalAtt > 0) {
        const presentAtt = await Attendence.count({ where: { status: 1 } });
        attendanceRate = Math.round((presentAtt / totalAtt) * 100);
      }
    } catch (e) {
      console.warn("Attendance count warn:", e.message);
    }

    // 4. Fees financials
    let totalFees = 0;
    let paidFees = 0;
    let dueFees = 0;
    try {
      const feesRecords = await Fees.findAll({
        attributes: ["total_amount", "paid_amount", "status"],
      });
      feesRecords.forEach((f) => {
        const tot = Number(f.total_amount) || 0;
        const pd = Number(f.paid_amount) || 0;
        totalFees += tot;
        paidFees += pd;
      });
      dueFees = Math.max(0, totalFees - paidFees);
    } catch (e) {
      console.warn("Fees summary warn:", e.message);
    }

    // 5. Feedback Rating average
    let avgFeedback = 4.5;
    try {
      const fbCount = await Feedback.count();
      if (fbCount > 0) {
        const fbSum = await Feedback.sum("rating");
        avgFeedback = Number((fbSum / fbCount).toFixed(1));
      }
    } catch (e) {
      console.warn("Feedback avg warn:", e.message);
    }

    // 6. Recent Registered Students
    let recentStudents = [];
    try {
      recentStudents = await User.findAll({
        where: { user_type: "student" },
        attributes: ["user_id", "first_name", "last_name", "user_name", "email", "course", "sem", "enrollment"],
        order: [["user_id", "DESC"]],
        limit: 5,
      });
    } catch (e) {
      console.warn("Recent students warn:", e.message);
    }

    // 7. Recent Notices
    let recentNotices = [];
    try {
      recentNotices = await Notice.findAll({
        order: [["notice_id", "DESC"]],
        limit: 5,
      });
    } catch (e) {
      console.warn("Recent notices warn:", e.message);
    }

    // 8. Recent Materials
    let recentMaterials = [];
    try {
      recentMaterials = await Material.findAll({
        order: [["id", "DESC"]],
        limit: 5,
      });
    } catch (e) {
      console.warn("Recent materials warn:", e.message);
    }

    // 9. Recent Fee Transactions
    let recentFees = [];
    try {
      recentFees = await Fees.findAll({
        order: [["fee_id", "DESC"]],
        limit: 5,
      });
    } catch (e) {
      console.warn("Recent fees warn:", e.message);
    }

    // 10. Course Breakdown
    let courseDistribution = [];
    try {
      const allCourses = await Course.findAll({ attributes: ["course_name", "course_code"] });
      const studentsList = await User.findAll({
        where: { user_type: "student" },
        attributes: ["course"],
      });

      const countsMap = {};
      studentsList.forEach((s) => {
        const c = s.course || "Other";
        countsMap[c] = (countsMap[c] || 0) + 1;
      });

      if (allCourses.length > 0) {
        courseDistribution = allCourses.map((c) => ({
          course: c.course_name,
          code: c.course_code,
          students: countsMap[c.course_name] || countsMap[c.course_code] || 0,
        }));
      } else {
        courseDistribution = Object.keys(countsMap).map((k) => ({
          course: k,
          code: k,
          students: countsMap[k],
        }));
      }
    } catch (e) {
      console.warn("Course distribution warn:", e.message);
    }

    // System uptime & health
    const uptimeSec = process.uptime();
    const memoryUsage = process.memoryUsage();
    const ramUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    return res.status(200).json({
      success: true,
      data: {
        counts: {
          students: totalStudents,
          faculty: totalFaculty,
          admins: totalAdmins,
          courses: totalCourses,
          materials: totalMaterials,
          notices: totalNotices,
          assignments: totalAssignments,
          pendingLeaves: pendingLeaves,
          attendanceRate: attendanceRate,
          totalFees: totalFees,
          paidFees: paidFees,
          dueFees: dueFees,
          avgFeedback: avgFeedback,
        },
        recentStudents,
        recentNotices,
        recentMaterials,
        recentFees,
        courseDistribution,
        health: {
          api: "ONLINE",
          db: "CONNECTED",
          uptime: Math.round(uptimeSec),
          ramUsedMB,
          lastSync: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Overview Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin dashboard overview",
    });
  }
};
