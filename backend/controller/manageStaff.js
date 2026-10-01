const managestaff = require("../services/manageStaff");

// Add
exports.postManageStaffAdd = async (req, res, next) => {
  try {
    const body = req.body;
    const db = await managestaff.manageStaffInsert(body);

    return res.status(200).json({
      success: true,
      message: "Faculty added successfully",
      data: db,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// Delete by old route
exports.postManageStaffDel = async (req, res, next) => {
  try {
    const id =
      req.body.staff_id ||
      req.body.id ||
      req.body._id ||
      req.body.staffId ||
      req.body.faculty_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "staff_id required",
      });
    }

    const data = await managestaff.deleteData(id);

    return res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// Edit / fetch one
exports.postManageStaffEdit = async (req, res, next) => {
  try {
    const id =
      req.body.staff_id ||
      req.body.id ||
      req.body._id ||
      req.body.staffId ||
      req.body.faculty_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "staff_id required",
      });
    }

    const data = await managestaff.viewStaffOneData(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Faculty fetched successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// Update
exports.postManageStaffUp = async (req, res, next) => {
  try {
    const body = req.body;
    const updated = await managestaff.StaffUpdate(body);

    return res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      data: updated,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// View all
exports.postStaffData = async (req, res, next) => {
  try {
    const data = await managestaff.viewStaffData();

    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// View one
exports.postOneData = async (req, res, next) => {
  try {
    const id =
      req.body.staff_id ||
      req.body.id ||
      req.body._id ||
      req.body.staffId ||
      req.body.faculty_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id or staff_id is required",
      });
    }

    const data = await managestaff.viewStaffOneData(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// Delete
exports.postDelete = async (req, res, next) => {
  try {
    const id =
      req.body.staff_id ||
      req.body.id ||
      req.body._id ||
      req.body.staffId ||
      req.body.faculty_id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "staff_id required",
      });
    }

    const data = await managestaff.deleteData(id);

    return res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
      data,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// Total
exports.postTotalStaff = async (req, res, next) => {
  try {
    const total = await managestaff.totalStaff();

    return res.status(200).json({
      success: true,
      totalStaff: total,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};