const { Op } = require("sequelize");
const LeaveRequest = require("../models/leaveRequest");

const VALID_STATUSES = ["Pending", "Approved", "Rejected"];
const VALID_PRIORITIES = ["Low", "Normal", "High"];

const clean = (obj) => {
  const out = { ...obj };
  Object.keys(out).forEach((key) => {
    if (out[key] === undefined || out[key] === null) delete out[key];
  });
  return out;
};

const calcDays = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
};

exports.leaveRequestCreate = async (body) => {
  try {
    const data = body || {};

    if (!data.student_id) throw new Error("student_id is required");
    if (!data.leave_type?.trim()) throw new Error("leave_type is required");
    if (!data.from_date) throw new Error("from_date is required");
    if (!data.to_date) throw new Error("to_date is required");
    if (!data.reason?.trim()) throw new Error("reason is required");

    if (new Date(data.to_date) < new Date(data.from_date)) {
      throw new Error("to_date cannot be earlier than from_date");
    }

    const priority = data.priority || "Normal";
    const status = data.status || "Pending";

    if (!VALID_PRIORITIES.includes(priority)) {
      throw new Error("priority must be Low, Normal, or High");
    }

    if (!VALID_STATUSES.includes(status)) {
      throw new Error("status must be Pending, Approved, or Rejected");
    }

    const total_days =
      data.total_days && Number(data.total_days) > 0
        ? Number(data.total_days)
        : calcDays(data.from_date, data.to_date);

    const payload = clean({
      student_id: Number(data.student_id),
      leave_type: String(data.leave_type).trim(),
      from_date: data.from_date,
      to_date: data.to_date,
      reason: String(data.reason).trim(),
      priority,
      status,
      faculty_note: data.faculty_note ? String(data.faculty_note).trim() : null,
      total_days,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const result = await LeaveRequest.create(payload);
    return result;
  } catch (err) {
    throw err;
  }
};

exports.leaveRequestList = async (body = {}) => {
  try {
    const page = Number(body.page || 1);
    const limit = Number(body.limit || 50);
    const offset = (page - 1) * limit;

    const where = {};

    if (body.status && body.status !== "All") {
      where.status = body.status;
    }

    if (body.student_id) {
      where.student_id = Number(body.student_id);
    }

    if (body.search?.trim()) {
      const q = body.search.trim();
      where[Op.or] = [
        { leave_type: { [Op.iLike]: `%${q}%` } },
        { reason: { [Op.iLike]: `%${q}%` } },
        { faculty_note: { [Op.iLike]: `%${q}%` } },
      ];
    }

    if (body.from_date && body.to_date) {
      where.from_date = { [Op.gte]: body.from_date };
      where.to_date = { [Op.lte]: body.to_date };
    }

    const result = await LeaveRequest.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    return {
      total: result.count,
      page,
      limit,
      data: result.rows,
    };
  } catch (err) {
    throw err;
  }
};

exports.leaveRequestFindOne = async (body) => {
  try {
    if (!body.id) throw new Error("id is required");

    const result = await LeaveRequest.findOne({
      where: { id: Number(body.id) },
    });

    if (!result) throw new Error("Leave request not found");

    return result;
  } catch (err) {
    throw err;
  }
};

exports.leaveRequestUpdate = async (body) => {
  try {
    if (!body.id) throw new Error("id is required");

    const existing = await LeaveRequest.findOne({
      where: { id: Number(body.id) },
    });

    if (!existing) throw new Error("Leave request not found");

    const nextStudentId = body.student_id ?? existing.student_id;
    const nextLeaveType = body.leave_type ?? existing.leave_type;
    const nextFromDate = body.from_date ?? existing.from_date;
    const nextToDate = body.to_date ?? existing.to_date;
    const nextReason = body.reason ?? existing.reason;
    const nextPriority = body.priority ?? existing.priority;
    const nextStatus = body.status ?? existing.status;
    const nextFacultyNote =
      body.faculty_note !== undefined ? body.faculty_note : existing.faculty_note;

    if (!nextStudentId) throw new Error("student_id is required");
    if (!String(nextLeaveType).trim()) throw new Error("leave_type is required");
    if (!nextFromDate) throw new Error("from_date is required");
    if (!nextToDate) throw new Error("to_date is required");
    if (!String(nextReason).trim()) throw new Error("reason is required");

    if (new Date(nextToDate) < new Date(nextFromDate)) {
      throw new Error("to_date cannot be earlier than from_date");
    }

    if (!VALID_PRIORITIES.includes(nextPriority)) {
      throw new Error("priority must be Low, Normal, or High");
    }

    if (!VALID_STATUSES.includes(nextStatus)) {
      throw new Error("status must be Pending, Approved, or Rejected");
    }

    const total_days =
      body.total_days && Number(body.total_days) > 0
        ? Number(body.total_days)
        : calcDays(nextFromDate, nextToDate);

    const payload = clean({
      student_id: Number(nextStudentId),
      leave_type: String(nextLeaveType).trim(),
      from_date: nextFromDate,
      to_date: nextToDate,
      reason: String(nextReason).trim(),
      priority: nextPriority,
      status: nextStatus,
      faculty_note: nextFacultyNote ? String(nextFacultyNote).trim() : null,
      total_days,
      updated_at: new Date(),
    });

    await LeaveRequest.update(payload, {
      where: { id: Number(body.id) },
    });

    const updated = await LeaveRequest.findOne({
      where: { id: Number(body.id) },
    });

    return updated;
  } catch (err) {
    throw err;
  }
};

exports.leaveRequestDelete = async (body) => {
  try {
    if (!body.id) throw new Error("id is required");

    const existing = await LeaveRequest.findOne({
      where: { id: Number(body.id) },
    });

    if (!existing) throw new Error("Leave request not found");

    await LeaveRequest.destroy({
      where: { id: Number(body.id) },
    });

    return { id: Number(body.id) };
  } catch (err) {
    throw err;
  }
};

exports.leaveRequestChangeStatus = async (body) => {
  try {
    if (!body.id) throw new Error("id is required");
    if (!body.status) throw new Error("status is required");

    if (!VALID_STATUSES.includes(body.status)) {
      throw new Error("status must be Pending, Approved, or Rejected");
    }

    const existing = await LeaveRequest.findOne({
      where: { id: Number(body.id) },
    });

    if (!existing) throw new Error("Leave request not found");

    await LeaveRequest.update(
      {
        status: body.status,
        updated_at: new Date(),
      },
      {
        where: { id: Number(body.id) },
      }
    );

    const updated = await LeaveRequest.findOne({
      where: { id: Number(body.id) },
    });

    return updated;
  } catch (err) {
    throw err;
  }
};