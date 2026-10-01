const FeesService = require("../services/fees");

// ADD
exports.postFeesAdd = async (req, res, next) => {
  try {
    console.log("REQ BODY FEES ADD =>", req.body);

    const body = req.body;

    const normalizeOne = (d) => ({
      student_id: d.student_id,
      student_name: d.student_name || d.name,
      enrollment: d.enrollment,
      course: d.course,
      sem: d.sem || d.semester,
      year: d.year || new Date().getFullYear(),
      fee_type: d.fee_type || "Tuition",
      total_amount: d.total_amount || 0,
      paid_amount: d.paid_amount || 0,
      due_date: d.due_date || d.payment_date,
      status: d.status || d.payment_status || "DUE",
      remarks: d.remarks || d.note || "",
    });

    const payload = Array.isArray(body) ? body.map(normalizeOne) : normalizeOne(body);

    const checkRequired = (x) =>
      x?.student_id &&
      x?.student_name &&
      x?.enrollment &&
      x?.course &&
      x?.sem &&
      x?.due_date;

    if (Array.isArray(payload)) {
      const bad = payload.find((x) => !checkRequired(x));
      if (bad) {
        return res.status(400).json({
          message: "Missing required fields in some rows",
          bad,
        });
      }
    } else {
      if (!checkRequired(payload)) {
        return res.status(400).json({
          message: "Missing required fields",
          payload,
        });
      }
    }

    const db = await FeesService.feesInsert(payload);

    res.status(200).json({
      message: Array.isArray(payload) ? "Bulk fees inserted" : "Fees inserted",
      count: Array.isArray(payload) ? db.length : 1,
      data: db,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// VIEW ALL
exports.postFeesData = async (req, res, next) => {
  try {
    const rows = await FeesService.viewFeesData(req.body || {});

    res.status(200).json({
      rows,
      total: rows.length,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// VIEW ONE
exports.postOneData = async (req, res, next) => {
  try {
    const fee_id = req.body.fee_id || req.body.id;

    if (!fee_id) {
      return res.status(400).json({ message: "fee_id is required" });
    }

    const data = await FeesService.viewFeesOneData(fee_id);

    res.status(200).json({ data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// UPDATE
exports.postFeesUpdate = async (req, res, next) => {
  try {
    const body = req.body;

    if (!body.fee_id && body.id) body.fee_id = body.id;

    if (!body.fee_id) {
      return res.status(400).json({ message: "fee_id is required for update" });
    }

    body.sem = body.sem || body.semester;
    body.remarks = body.remarks || body.note || "";

    const result = await FeesService.FeesUpdate(body);

    res.status(200).json({
      message: "Fees updated",
      result,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// DELETE
exports.postFeesDel = async (req, res, next) => {
  try {
    const fee_id = req.body.fee_id || req.body.id;

    if (!fee_id) {
      return res.status(400).json({ message: "fee_id is required for delete" });
    }

    const result = await FeesService.deleteData(fee_id);

    res.status(200).json({
      message: "Fees deleted",
      result,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

/* ===========================
   NEW ENDPOINTS FOR REACT
=========================== */

// LIST
exports.postFeesList = async (req, res, next) => {
  try {
    const body = req.body || {};

    const page = body.page;
    const limit = body.limit;

    const q = body.q || body.search || "";

    const filters = body.filters || {
      course: body.course || "",
      sem: body.sem || body.semester || "",
      year: body.year || "",
      status: body.status || "",
    };

    const data = await FeesService.listFees({ page, limit, q, filters });
    res.status(200).json(data);
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// SUMMARY
exports.postFeesSummary = async (req, res, next) => {
  try {
    const body = req.body || {};

    const q = body.q || body.search || "";
    const filters = body.filters || {
      course: body.course || "",
      sem: body.sem || body.semester || "",
      year: body.year || "",
      status: body.status || "",
    };

    const data = await FeesService.summaryFees({ filters, q });
    res.status(200).json(data);
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// PAY
exports.postFeesPay = async (req, res, next) => {
  try {
    const payload = {
      fee_id: req.body?.fee_id,
      amount: req.body?.amount,
      payment_mode: req.body?.payment_mode || req.body?.mode,
      transaction_id: req.body?.transaction_id || req.body?.txn_id,
      note: req.body?.note,
      paid_on: req.body?.paid_on,
    };

    const data = await FeesService.payFee(payload);
    res.status(200).json({ message: "Payment recorded", data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = err.statusCode || 500;
    next(err);
  }
};

// BULK STATUS
exports.postFeesBulkStatus = async (req, res, next) => {
  try {
    const result = await FeesService.bulkStatus(req.body || {});
    res.status(200).json({ message: "Bulk status updated", result });
  } catch (err) {
    if (!err.statusCode) err.statusCode = err.statusCode || 500;
    next(err);
  }
};

// EXPORT
exports.postFeesExport = async (req, res, next) => {
  try {
    const body = req.body || {};

    const q = body.q || body.search || "";
    const filters = body.filters || {
      course: body.course || "",
      sem: body.sem || body.semester || "",
      year: body.year || "",
      status: body.status || "",
    };

    const data = await FeesService.exportCSV({ filters, q });
    res.status(200).json(data);
  } catch (err) {
    if (!err.statusCode) err.statusCode = err.statusCode || 500;
    next(err);
  }
};

// RECEIPT
exports.postFeesReceipt = async (req, res, next) => {
  try {
    const { fee_id } = req.body || {};
    const data = await FeesService.receipt({ fee_id });
    res.status(200).json({ message: "Receipt generated", ...data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = err.statusCode || 500;
    next(err);
  }
};


exports.postNoticeUp = exports.postFeesUpdate;
exports.postUpdate = exports.postFeesUpdate;
exports.postDelete = exports.postFeesDel;
exports.postFeesEdit = exports.postOneData;