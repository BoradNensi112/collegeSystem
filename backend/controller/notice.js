const notice = require("../services/notice");

// CREATE
exports.create = async (req, res) => {
  try {
    const body = req.body;
    const db = await notice.noticeInsert(body);

    return res.status(200).json({
      success: true,
      message: Array.isArray(body) ? "Bulk inserted" : "Notice created",
      data: db,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Create failed",
    });
  }
};

// LIST ALL
exports.postNoticeData = async (req, res) => {
  try {
    const data = await notice.viewNoticeData();

    return res.status(200).json({
      success: true,
      message: "Success",
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "List failed",
    });
  }
};

// VIEW ONE
exports.one = async (req, res) => {
  try {
    const id = req.body.notice_id ?? req.body.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "notice_id required",
      });
    }

    const data = await notice.viewNoticeOneData(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Success",
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Fetch failed",
    });
  }
};

// UPDATE
exports.update = async (req, res) => {
  try {
    const body = req.body;

    if (!body.notice_id) {
      return res.status(400).json({
        success: false,
        message: "notice_id required",
      });
    }

    const result = await notice.NoticeUpdate(body);
    const affected = Array.isArray(result) ? result[0] : result;

    if (!affected) {
      return res.status(404).json({
        success: false,
        message: "Notice not found / not updated",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notice updated",
      data: result,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Update failed",
    });
  }
};

// DELETE
exports.remove = async (req, res) => {
  try {
    const id = req.body.notice_id ?? req.body.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "notice_id required",
      });
    }

    const affected = await notice.deleteData(id);

    if (!affected) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notice deleted",
      data: affected,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Delete failed",
    });
  }
};

// TOGGLE
exports.toggle = async (req, res) => {
  try {
    const id = req.body.notice_id ?? req.body.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "notice_id required",
      });
    }

    const data = await notice.toggleNoticeStatus(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status toggled",
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Toggle failed",
    });
  }
};

// backward compatibility
exports.postNoticeAdd = exports.create;
exports.postDelete = exports.remove;
exports.postUpdate = exports.update;
exports.postOneData = exports.one;