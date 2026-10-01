const leaveRequestService = require("../services/leaveRequest");

exports.postLeaveRequestCreate = async (req, res, next) => {
  try {
    const data = await leaveRequestService.leaveRequestCreate(req.body);

    return res.status(200).json({
      message: "Leave request created successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    return res.status(err.statusCode).json({
      message: err.message || "Failed to create leave request",
    });
  }
};

exports.postLeaveRequestList = async (req, res, next) => {
  try {
    const data = await leaveRequestService.leaveRequestList(req.body);

    return res.status(200).json({
      message: "Leave request list fetched successfully",
      ...data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    return res.status(err.statusCode).json({
      message: err.message || "Failed to fetch leave request list",
    });
  }
};

exports.postLeaveRequestFindOne = async (req, res, next) => {
  try {
    const data = await leaveRequestService.leaveRequestFindOne(req.body);

    return res.status(200).json({
      message: "Leave request fetched successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    return res.status(err.statusCode).json({
      message: err.message || "Failed to fetch leave request",
    });
  }
};

exports.postLeaveRequestUpdate = async (req, res, next) => {
  try {
    const data = await leaveRequestService.leaveRequestUpdate(req.body);

    return res.status(200).json({
      message: "Leave request updated successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    return res.status(err.statusCode).json({
      message: err.message || "Failed to update leave request",
    });
  }
};

exports.postLeaveRequestDelete = async (req, res, next) => {
  try {
    const data = await leaveRequestService.leaveRequestDelete(req.body);

    return res.status(200).json({
      message: "Leave request deleted successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    return res.status(err.statusCode).json({
      message: err.message || "Failed to delete leave request",
    });
  }
};

exports.postLeaveRequestStatus = async (req, res, next) => {
  try {
    const data = await leaveRequestService.leaveRequestChangeStatus(req.body);

    return res.status(200).json({
      message: "Leave request status updated successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    return res.status(err.statusCode).json({
      message: err.message || "Failed to update leave request status",
    });
  }
};