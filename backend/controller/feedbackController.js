const feedbackService = require("../services/feedbackService");

const createSession = async (req, res) => {
  try {
    const adminId = req.auth?.user_id || null;

    const session = await feedbackService.createSession(req.body, adminId);

    return res.status(201).json({
      success: true,
      message: "Feedback session created successfully",
      data: session,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSession = async (req, res) => {
  try {
    const session = await feedbackService.updateSession(
      req.params.session_id,
      req.body
    );

    return res.json({
      success: true,
      message: "Feedback session updated successfully",
      data: session,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllSessions = async (req, res) => {
  try {
    const rows = await feedbackService.getAllSessions();
    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getActiveSession = async (req, res) => {
  try {
    const row = await feedbackService.getActiveSession();
    return res.json({
      success: true,
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const submitFeedback = async (req, res) => {
  try {
    console.log("AUTH DATA:", req.auth);

    const studentId = req.auth?.user_id;

    const saved = await feedbackService.submitFeedback(req.body, studentId);

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: saved,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getFeedbackList = async (req, res) => {
  try {
    const rows = await feedbackService.getFeedbackList(req.body || {});
    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFacultySummary = async (req, res) => {
  try {
    const rows = await feedbackService.getFacultyFeedbackSummary(
      req.body?.session_id || null
    );
    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCollegeSummary = async (req, res) => {
  try {
    const rows = await feedbackService.getCollegeFeedbackSummary(
      req.body?.session_id || null
    );
    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const data = await feedbackService.getDashboardSummary(
      req.body?.session_id || null
    );
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSession,
  updateSession,
  getAllSessions,
  getActiveSession,
  submitFeedback,
  getFeedbackList,
  getFacultySummary,
  getCollegeSummary,
  getDashboardSummary,
};