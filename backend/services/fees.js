const Fees = require("../models/fees");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

/* Helpers */

const todayStr = () => new Date().toISOString().slice(0, 10);

const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeStatus = (rowLike) => {
  const total = safeNum(rowLike.total_amount);
  const paid = safeNum(rowLike.paid_amount);
  const due = Math.max(0, total - paid);

  const dd = rowLike.due_date ? String(rowLike.due_date).slice(0, 10) : null;
  const isOver = dd ? dd < todayStr() : false;

  let st = String(rowLike.status || "").toUpperCase();
  if (!st) st = "DUE";

  if (total > 0 && due <= 0) st = "PAID";
  else if (paid > 0 && due > 0) st = "PARTIAL";
  else if (due > 0 && isOver) st = "OVERDUE";
  else if (due > 0) st = "DUE";

  return { status: st, due, total, paid };
};

const buildWhere = ({ q = "", filters = {} }) => {
  const where = {};

  const qq = String(q || "").trim();
  if (qq) {
    const like = `%${qq}%`;
    where[Op.or] = [
      { student_name: { [Op.like]: like } },
      { enrollment: { [Op.like]: like } },
      { fee_type: { [Op.like]: like } },
      { student_id: { [Op.like]: like } },
      { course: { [Op.like]: like } },
    ];
  }

  if (filters?.course && filters.course !== "ALL") where.course = filters.course;
  if (filters?.sem && filters.sem !== "ALL") where.sem = Number(filters.sem);
  if (filters?.year && filters.year !== "ALL") where.year = Number(filters.year);
  if (filters?.status && filters.status !== "ALL") where.status = String(filters.status).toUpperCase();

  return where;
};

  

// INSERT 
exports.feesInsert = async (body) => {
  try {
    if (Array.isArray(body)) {
      const db_status = await Fees.bulkCreate(body, {
        validate: true,
      });
      return db_status;
    }

    const db_status = await Fees.create({
      student_id: body.student_id,
      student_name: body.student_name,
      enrollment: body.enrollment,
      course: body.course,
      sem: body.sem,
      year: body.year,
      fee_type: body.fee_type,
      total_amount: body.total_amount,
      paid_amount: body.paid_amount,
      due_date: body.due_date,
      status: body.status,
      remarks: body.remarks,
    });

    return db_status;
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = 500;
    throw error;
  }
};

// VIEW ALL
exports.viewFeesData = async (body = {}) => {
  try {
    const where = {};
    if (body.student_id && body.enrollment) {
      where[Op.or] = [
        { student_id: String(body.student_id) },
        { enrollment: String(body.enrollment) },
      ];
    } else if (body.student_id) {
      where.student_id = String(body.student_id);
    } else if (body.enrollment) {
      where.enrollment = String(body.enrollment);
    }
    if (body.course && body.course !== "ALL") where.course = body.course;
    if (body.sem && body.sem !== "ALL") where.sem = Number(body.sem);
    if (body.year && body.year !== "ALL") where.year = Number(body.year);
    if (body.status && body.status !== "ALL") where.status = String(body.status).toUpperCase();

    const data = await Fees.findAll({
      where,
      order: [["fee_id", "DESC"]],
    });
    return data;
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = 500;
    throw error;
  }
};

// VIEW ONE
exports.viewFeesOneData = async (id) => {
  try {
    const data = await Fees.findOne({
      where: { fee_id: id },
    });
    return data;
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = 500;
    throw error;
  }
};

// DELETE
exports.deleteData = async (id) => {
  try {
    const data = await Fees.destroy({
      where: { fee_id: id },
    });
    return data;
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = 500;
    throw error;
  }
};

// UPDATE
exports.FeesUpdate = async (body) => {
  try {
    const data = body;

    const result = await Fees.update(
      {
        student_id: data.student_id,
        student_name: data.student_name,
        enrollment: data.enrollment,
        course: data.course,
        sem: data.sem,
        year: data.year,
        fee_type: data.fee_type,
        total_amount: data.total_amount,
        paid_amount: data.paid_amount,
        due_date: data.due_date,
        status: data.status,
        remarks: data.remarks,
      },
      {
        where: { fee_id: data.fee_id },
      }
    );

    return result;
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = 500;
    throw error;
  }
};

/* React APIs */

// LIST
exports.listFees = async ({ page = 1, limit = 10, q = "", filters = {} }) => {
  try {
    page = Number(page || 1);
    limit = Number(limit || 10);
    const offset = (page - 1) * limit;

    const where = buildWhere({ q, filters });

    const { rows, count } = await Fees.findAndCountAll({
      where,
      order: [["fee_id", "DESC"]],
      limit,
      offset,
    });

    return { rows, total: count };
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = 500;
    throw error;
  }
};

// SUMMARY
exports.summaryFees = async ({ filters = {}, q = "" }) => {
  try {
    const where = buildWhere({ q, filters });

    const rows = await Fees.findAll({
      where,
      order: [["fee_id", "DESC"]],
    });

    let paidSum = 0;
    let dueSum = 0;
    let overdueSum = 0;
    const t = todayStr();

    for (const r of rows) {
      const total = safeNum(r.total_amount);
      const paid = safeNum(r.paid_amount);
      const due = Math.max(0, total - paid);

      paidSum += paid;
      dueSum += due;

      const dd = r.due_date ? String(r.due_date).slice(0, 10) : null;
      if (dd && dd < t && due > 0) overdueSum += due;
    }

    return { total: paidSum, paid: paidSum, due: dueSum, overdue: overdueSum };
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = 500;
    throw error;
  }
};

// PAY
exports.payFee = async ({ fee_id, amount, payment_mode, transaction_id, note, paid_on }) => {
  try {
    const id = Number(fee_id);
    if (!id) {
      const error = new Error("fee_id is required");
      error.statusCode = 400;
      throw error;
    }

    const amt = safeNum(amount);
    if (!(amt > 0)) {
      const error = new Error("amount must be > 0");
      error.statusCode = 400;
      throw error;
    }

    const fee = await Fees.findOne({ where: { fee_id: id } });
    if (!fee) {
      const error = new Error("Fee record not found");
      error.statusCode = 404;
      throw error;
    }

    const currentPaid = safeNum(fee.paid_amount);
    const newPaid = currentPaid + amt;

    const { status } = normalizeStatus({
      ...fee.toJSON(),
      paid_amount: newPaid,
    });

    const line = `PAYMENT ₹${amt} | ${payment_mode || "NA"} | ${transaction_id || "-"} | ${paid_on || todayStr()} | ${note || ""}`.trim();

    const mergedRemarks = [fee.remarks ? String(fee.remarks) : "", line]
      .filter(Boolean)
      .join("\n");

    await Fees.update(
      { paid_amount: newPaid, status, remarks: mergedRemarks },
      { where: { fee_id: id } }
    );

    const updated = await Fees.findOne({ where: { fee_id: id } });
    return updated;
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

// BULK STATUS
exports.bulkStatus = async ({ fee_ids = [], ids = [], status }) => {
  try {
    const finalIds = Array.isArray(fee_ids) && fee_ids.length ? fee_ids : ids;

    if (!Array.isArray(finalIds) || finalIds.length === 0) {
      const error = new Error("fee_ids[] is required");
      error.statusCode = 400;
      throw error;
    }

    if (!status) {
      const error = new Error("status is required");
      error.statusCode = 400;
      throw error;
    }

    const st = String(status).toUpperCase();
    const idNums = finalIds.map((x) => Number(x)).filter(Boolean);

    const result = await Fees.update(
      { status: st },
      { where: { fee_id: { [Op.in]: idNums } } }
    );

    return result;
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

// EXPORT CSV
exports.exportCSV = async ({ filters = {}, q = "" }) => {
  try {
    const where = buildWhere({ q, filters });
    const rows = await Fees.findAll({ where, order: [["fee_id", "DESC"]] });

    const exportDir = path.join(process.cwd(), "exports");
    fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `fees_export_${Date.now()}.csv`;
    const filePath = path.join(exportDir, fileName);

    const header = [
      "fee_id",
      "student_id",
      "student_name",
      "enrollment",
      "course",
      "sem",
      "year",
      "fee_type",
      "total_amount",
      "paid_amount",
      "due_date",
      "status",
      "remarks",
    ];

    const esc = (v) => {
      const s = String(v ?? "");
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(header.map((k) => esc(r[k])).join(","));
    }

    fs.writeFileSync(filePath, lines.join("\n"), "utf8");

    return { url: `/exports/${fileName}` };
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

// RECEIPT
exports.receipt = async ({ fee_id }) => {
  try {
    const id = Number(fee_id);
    if (!id) {
      const error = new Error("fee_id is required");
      error.statusCode = 400;
      throw error;
    }

    const fee = await Fees.findOne({ where: { fee_id: id } });
    if (!fee) {
      const error = new Error("Fee record not found");
      error.statusCode = 404;
      throw error;
    }

    const exportDir = path.join(process.cwd(), "exports");
    fs.mkdirSync(exportDir, { recursive: true });

    const fileName = `receipt_${id}_${Date.now()}.html`;
    const filePath = path.join(exportDir, fileName);

    const total = safeNum(fee.total_amount);
    const paid = safeNum(fee.paid_amount);
    const due = Math.max(0, total - paid);

    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Fee Receipt #${id}</title>
<style>
  body{font-family: Arial, sans-serif; padding:24px; background:#f6f7fb;}
  .card{max-width:760px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:22px;}
  h2{margin:0 0 10px;}
  .muted{color:#6b7280;}
  table{width:100%;border-collapse:collapse;margin-top:14px;}
  td{padding:10px;border-bottom:1px solid #eee;}
  .right{text-align:right;}
  .total{font-size:18px;font-weight:bold;}
</style>
</head>
<body>
<div class="card">
  <h2>NavNext Fee Receipt</h2>
  <div class="muted">Receipt ID: ${id}</div>
  <div class="muted">Generated: ${todayStr()}</div>

  <table>
    <tr><td>Student</td><td class="right"><b>${fee.student_name}</b></td></tr>
    <tr><td>Enrollment</td><td class="right">${fee.enrollment}</td></tr>
    <tr><td>Course / Sem</td><td class="right">${fee.course} / ${fee.sem}</td></tr>
    <tr><td>Fee Type</td><td class="right">${fee.fee_type}</td></tr>
    <tr><td>Due Date</td><td class="right">${String(fee.due_date).slice(0, 10)}</td></tr>
    <tr><td>Total Amount</td><td class="right">₹ ${total.toLocaleString("en-IN")}</td></tr>
    <tr><td>Paid Amount</td><td class="right">₹ ${paid.toLocaleString("en-IN")}</td></tr>
    <tr><td class="total">Due</td><td class="right total">₹ ${due.toLocaleString("en-IN")}</td></tr>
  </table>

  <p class="muted" style="margin-top:12px; white-space:pre-wrap;">Remarks:\n${fee.remarks || ""}</p>
</div>
</body>
</html>`;

    fs.writeFileSync(filePath, html, "utf8");

    return { url: `/exports/${fileName}` };
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};