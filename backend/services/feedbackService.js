const { Op, fn, col } = require("sequelize");
const Feedback = require("../models/Feedback");
const FeedbackSession = require("../models/FeedbackSession");

function normalizeType(type) {
  return String(type || "").trim().toUpperCase();
}

function getTodayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

async function createSession(data, userId) {
  const { title, start_date, end_date, is_active = true } = data;

  if (!title || !start_date || !end_date) {
    throw new Error("title, start_date and end_date are required");
  }

  if (start_date > end_date) {
    throw new Error("start_date cannot be greater than end_date");
  }

  if (is_active) {
    await FeedbackSession.update(
      { is_active: false },
      { where: { is_active: true } }
    );
  }

  const session = await FeedbackSession.create({
    title,
    start_date,
    end_date,
    is_active,
    created_by: userId || null,
  });

  return session;
}

async function updateSession(sessionId, data) {
  const session = await FeedbackSession.findByPk(sessionId);
  if (!session) {
    throw new Error("Feedback session not found");
  }

  const nextData = {
    title: data.title ?? session.title,
    start_date: data.start_date ?? session.start_date,
    end_date: data.end_date ?? session.end_date,
    is_active:
      typeof data.is_active === "boolean" ? data.is_active : session.is_active,
  };

  if (nextData.start_date > nextData.end_date) {
    throw new Error("start_date cannot be greater than end_date");
  }

  if (nextData.is_active === true) {
    await FeedbackSession.update(
      { is_active: false },
      {
        where: {
          is_active: true,
          session_id: { [Op.ne]: sessionId },
        },
      }
    );
  }

  await session.update(nextData);
  return session;
}

async function getAllSessions() {
  return FeedbackSession.findAll({
    order: [["session_id", "DESC"]],
  });
}

async function getActiveSession() {
  const today = getTodayDateOnly();

  return FeedbackSession.findOne({
    where: {
      is_active: true,
      start_date: { [Op.lte]: today },
      end_date: { [Op.gte]: today },
    },
    order: [["session_id", "DESC"]],
  });
}

async function submitFeedback(data, studentId) {
  const type = normalizeType(data.feedback_type);
  const rating = Number(data.rating);

  if (!studentId) {
    throw new Error("Student not identified");
  }

  if (!["FACULTY", "COLLEGE"].includes(type)) {
    throw new Error("feedback_type must be FACULTY or COLLEGE");
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new Error("rating must be between 1 and 5");
  }

  const activeSession = await getActiveSession();
  if (!activeSession) {
    throw new Error("Feedback session is currently closed");
  }

  if (type === "FACULTY") {
    if (!data.faculty_id) {
      throw new Error("faculty_id is required for FACULTY feedback");
    }

    const already = await Feedback.findOne({
      where: {
        session_id: activeSession.session_id,
        student_id: studentId,
        feedback_type: "FACULTY",
        faculty_id: data.faculty_id,
      },
    });

    if (already) {
      throw new Error("You have already submitted feedback for this faculty");
    }

    return Feedback.create({
      session_id: activeSession.session_id,
      student_id: studentId,
      feedback_type: "FACULTY",
      faculty_id: data.faculty_id,
      rating,
      comment: data.comment || null,
      category: null,
    });
  }

  const alreadyCollege = await Feedback.findOne({
    where: {
      session_id: activeSession.session_id,
      student_id: studentId,
      feedback_type: "COLLEGE",
    },
  });

  if (alreadyCollege) {
    throw new Error("You have already submitted college feedback");
  }

  return Feedback.create({
    session_id: activeSession.session_id,
    student_id: studentId,
    feedback_type: "COLLEGE",
    faculty_id: null,
    category: data.category || "GENERAL",
    rating,
    comment: data.comment || null,
  });
}

async function getFeedbackList(filters = {}) {
  const where = {};

  if (filters.session_id) where.session_id = filters.session_id;
  if (filters.feedback_type) where.feedback_type = normalizeType(filters.feedback_type);
  if (filters.faculty_id) where.faculty_id = filters.faculty_id;
  if (filters.student_id) where.student_id = filters.student_id;
  if (filters.rating) where.rating = Number(filters.rating);
  if (filters.category) where.category = filters.category;

  return Feedback.findAll({
    where,
    include: [
      {
        model: FeedbackSession,
        as: "session",
        attributes: ["session_id", "title", "start_date", "end_date", "is_active"],
      },
    ],
    order: [["feedback_id", "DESC"]],
  });
}

async function getFacultyFeedbackSummary(session_id = null) {
  const where = { feedback_type: "FACULTY" };
  if (session_id) where.session_id = session_id;

  return Feedback.findAll({
    where,
    attributes: [
      "faculty_id",
      [fn("COUNT", col("feedback_id")), "total_feedback"],
      [fn("AVG", col("rating")), "avg_rating"],
    ],
    group: ["faculty_id"],
    order: [[fn("AVG", col("rating")), "DESC"]],
  });
}

async function getCollegeFeedbackSummary(session_id = null) {
  const where = { feedback_type: "COLLEGE" };
  if (session_id) where.session_id = session_id;

  return Feedback.findAll({
    where,
    attributes: [
      "category",
      [fn("COUNT", col("feedback_id")), "total_feedback"],
      [fn("AVG", col("rating")), "avg_rating"],
    ],
    group: ["category"],
    order: [[fn("AVG", col("rating")), "DESC"]],
  });
}

async function getDashboardSummary(session_id = null) {
  const where = {};
  if (session_id) where.session_id = session_id;

  const total = await Feedback.count({ where });
  const facultyCount = await Feedback.count({
    where: { ...where, feedback_type: "FACULTY" },
  });
  const collegeCount = await Feedback.count({
    where: { ...where, feedback_type: "COLLEGE" },
  });

  const avgResult = await Feedback.findOne({
    where,
    attributes: [[fn("AVG", col("rating")), "avg_rating"]],
    raw: true,
  });

  return {
    total_feedback: total,
    faculty_feedback: facultyCount,
    college_feedback: collegeCount,
    avg_rating: avgResult?.avg_rating ? Number(avgResult.avg_rating).toFixed(2) : "0.00",
  };
}

module.exports = {
  createSession,
  updateSession,
  getAllSessions,
  getActiveSession,
  submitFeedback,
  getFeedbackList,
  getFacultyFeedbackSummary,
  getCollegeFeedbackSummary,
  getDashboardSummary,
};