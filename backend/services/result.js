const { Op, fn, col } = require("sequelize");
const { ResultMaster, User } = require("../models"); // ✅ models/index.js must export these

// ---------- helpers ----------
const safeInt = (v, d = 0) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const safeNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const calcPercentage = (total, obtained) => {
  const t = safeNum(total, 0);
  const o = safeNum(obtained, 0);
  if (!t || t <= 0) return 0;
  const pct = (o / t) * 100;
  if (pct < 0) return 0;
  if (pct > 100) return 100;
  return Number(pct.toFixed(2));
};

const autoGrade = (pct) => {
  const p = safeNum(pct, 0);
  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";
  if (p >= 40) return "D";
  return "F";
};

const LIKE = Op.iLike || Op.like;

const buildWhere = (q, filters = {}) => {
  const where = {};

  // search query
  if (q && String(q).trim()) {
    const s = String(q).trim();
    where[Op.or] = [
      { student_name: { [LIKE]: `%${s}%` } },
      { enrollment: { [LIKE]: `%${s}%` } },
      { exam_name: { [LIKE]: `%${s}%` } },
      ...(String(s).match(/^\d+$/) ? [{ student_id: safeInt(s) }] : []),
    ];
  }

  // filters
  if (filters.course && filters.course !== "ALL") where.course = filters.course;

  if (filters.semester && filters.semester !== "ALL")
    where.semester = safeInt(filters.semester);

  if (filters.exam_name && filters.exam_name !== "ALL")
    where.exam_name = filters.exam_name;

  if (filters.status && filters.status !== "ALL") {
    if (filters.status === "PUBLISHED") where.published = true;
    if (filters.status === "DRAFT") where.published = false;
  }
  if (filters.from && filters.to) {
    where.declared_on = { [Op.between]: [filters.from, filters.to] };
  } else if (filters.from) {
    where.declared_on = { [Op.gte]: filters.from };
  } else if (filters.to) {
    where.declared_on = { [Op.lte]: filters.to };
  }

  return where;
};


exports.my = async (userId, { onlyPublished = true } = {}) => {
  try {
    const uid = safeInt(userId);
    if (!uid) {
      const error = new Error("Invalid user id");
      error.statusCode = 401;
      throw error;
    }

    const where = { student_id: uid };
    if (onlyPublished) where.published = true;

    const rows = await ResultMaster.findAll({
      where,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["user_id", "user_name", "first_name", "last_name", "enrollment", "course", "sem"],
        },
      ],
      order: [["declared_on", "DESC"], ["result_id", "DESC"]],
    });

    return rows;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};


exports.create = async (body) => {
  try {
    const data = body || {};

    const enrollment = String(data.enrollment || "").trim();
    if (!enrollment) {
      const error = new Error("enrollment is required");
      error.statusCode = 400;
      throw error;
    }

    const u = await User.findOne({ where: { enrollment } });
    if (!u) {
      const error = new Error("Student not found by enrollment");
      error.statusCode = 400;
      throw error;
    }

    const total_marks = safeInt(data.total_marks, 0);
    const obtained_marks = safeInt(data.obtained_marks, 0);
    const percentage = calcPercentage(total_marks, obtained_marks);
    const grade = (data.grade && String(data.grade).trim()) || autoGrade(percentage);

    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.user_name;

    const payload = {
      student_id: u.user_id,       
      student_name: fullName,     
      enrollment: u.enrollment,    

      course: (data.course || "").trim() || u.course || null,
      semester:
        data.semester !== undefined && data.semester !== null
          ? safeInt(data.semester)
          : (u.sem ?? null),

      exam_name: (data.exam_name || "Mid Sem").trim(),
      exam_year: data.exam_year ? safeInt(data.exam_year) : new Date().getFullYear(),

      obtained_marks,
      total_marks,
      percentage,
      grade,

      sgpa: data.sgpa ?? null,
      cgpa: data.cgpa ?? null,
      remark: (data.remark || "").trim() || null,

      published: !!data.published,
      declared_on: data.declared_on || null,
    };

    const db_status = await ResultMaster.create(payload);
    return db_status;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};


exports.update = async (body) => {
  try {
    const data = body || {};
    const result_id = safeInt(data.result_id || data.Result_id);

    if (!result_id) {
      const error = new Error("result_id is required");
      error.statusCode = 400;
      throw error;
    }

    // load existing row (for correct percentage/grade update)
    const existing = await ResultMaster.findOne({ where: { result_id } });
    if (!existing) {
      const error = new Error("Result not found");
      error.statusCode = 404;
      throw error;
    }

    // If admin sends enrollment => remap student
    let mappedStudent = null;
    if (data.enrollment !== undefined && String(data.enrollment || "").trim()) {
      const enr = String(data.enrollment || "").trim();
      mappedStudent = await User.findOne({ where: { enrollment: enr } });
      if (!mappedStudent) {
        const error = new Error("Student not found by enrollment");
        error.statusCode = 400;
        throw error;
      }
    }

    // Decide total/obtained for % calc only if marks updated
    const marksTouched = (data.total_marks !== undefined) || (data.obtained_marks !== undefined);

    const newTotal = data.total_marks !== undefined ? safeInt(data.total_marks, 0) : existing.total_marks;
    const newObt = data.obtained_marks !== undefined ? safeInt(data.obtained_marks, 0) : existing.obtained_marks;

    const newPct = marksTouched ? calcPercentage(newTotal, newObt) : existing.percentage;
    const newGrade = (data.grade !== undefined && String(data.grade || "").trim())
      ? String(data.grade || "").trim()
      : (marksTouched ? autoGrade(newPct) : existing.grade);

    const payload = {
      student_id: mappedStudent
        ? mappedStudent.user_id
        : (data.student_id !== undefined ? safeInt(data.student_id) : undefined),

      student_name: mappedStudent
        ? (`${mappedStudent.first_name || ""} ${mappedStudent.last_name || ""}`.trim() || mappedStudent.user_name)
        : (data.student_name !== undefined ? (data.student_name || "").trim() || null : undefined),

      enrollment: mappedStudent
        ? mappedStudent.enrollment
        : (data.enrollment !== undefined ? (data.enrollment || "").trim() || null : undefined),

      course: data.course !== undefined ? (data.course || "").trim() || null : undefined,
      semester: data.semester !== undefined ? safeInt(data.semester) : undefined,

      exam_name: data.exam_name !== undefined ? (data.exam_name || "").trim() : undefined,
      exam_year: data.exam_year !== undefined ? safeInt(data.exam_year) : undefined,

      obtained_marks: data.obtained_marks !== undefined ? newObt : undefined,
      total_marks: data.total_marks !== undefined ? newTotal : undefined,

      // only if marksTouched or grade explicitly passed we will set these
      percentage: marksTouched ? newPct : undefined,
      grade: (marksTouched || data.grade !== undefined) ? newGrade : undefined,

      sgpa: data.sgpa !== undefined ? data.sgpa : undefined,
      cgpa: data.cgpa !== undefined ? data.cgpa : undefined,
      remark: data.remark !== undefined ? (data.remark || "").trim() || null : undefined,

      published: data.published !== undefined ? !!data.published : undefined,
      declared_on: data.declared_on !== undefined ? data.declared_on : undefined,
    };

    // remove undefined keys
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const result = await ResultMaster.update(payload, { where: { result_id } });
    return result; // [affectedCount]
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

exports.remove = async (result_id) => {
  try {
    const id = safeInt(result_id);
    const data = await ResultMaster.destroy({ where: { result_id: id } });
    return data;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};


exports.one = async (result_id) => {
  try {
    const id = safeInt(result_id);
    const data = await ResultMaster.findOne({
      where: { result_id: id },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["user_id", "user_name", "first_name", "last_name", "enrollment", "course", "sem"],
        },
      ],
    });
    return data;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};


exports.list = async ({ page = 1, limit = 10, q = "", filters = {} }) => {
  try {
    const pg = Math.max(1, safeInt(page, 1));
    const lm = Math.min(100, Math.max(1, safeInt(limit, 10)));
    const offset = (pg - 1) * lm;

    const where = buildWhere(q, filters);

    const { rows, count } = await ResultMaster.findAndCountAll({
      where,
      order: [["declared_on", "DESC"], ["result_id", "DESC"]],
      limit: lm,
      offset,
    });

    return { rows, total: count };
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};


exports.summary = async ({ q = "", filters = {} }) => {
  try {
    const where = buildWhere(q, filters);

    const [total, published] = await Promise.all([
      ResultMaster.count({ where }),
      ResultMaster.count({ where: { ...where, published: true } }),
    ]);

    const draft = total - published;

    const avgRow = await ResultMaster.findOne({
      where,
      attributes: [[fn("AVG", col("percentage")), "avgPct"]],
      raw: true,
    });

    const avgPct = avgRow?.avgPct ? Number(avgRow.avgPct) : 0;

    return {
      total,
      published,
      draft,
      avgPct: Number(avgPct.toFixed(2)),
    };
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};


exports.togglePublish = async ({ result_id, published }) => {
  try {
    const id = safeInt(result_id);
    const res = await ResultMaster.update(
      { published: !!published },
      { where: { result_id: id } }
    );
    return res; // [affectedCount]
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};

exports.bulk = async ({ ids = [], action }) => {
  try {
    const cleanIds = (ids || []).map((x) => safeInt(x)).filter(Boolean);

    if (!cleanIds.length) {
      const error = new Error("ids required");
      error.statusCode = 400;
      throw error;
    }

    const act = String(action || "").toUpperCase();

    if (act === "DELETE") {
      const del = await ResultMaster.destroy({ where: { result_id: { [Op.in]: cleanIds } } });
      return { deleted: del };
    }

    if (act === "PUBLISH" || act === "UNPUBLISH") {
      const upd = await ResultMaster.update(
        { published: act === "PUBLISH" },
        { where: { result_id: { [Op.in]: cleanIds } } }
      );
      return { updated: upd?.[0] || 0 };
    }

    const error = new Error("Invalid action");
    error.statusCode = 400;
    throw error;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};


exports.send = async ({ ids = [], channel = "APP", note = "" }) => {
  try {
    const cleanIds = (ids || []).map((x) => safeInt(x)).filter(Boolean);
    if (!cleanIds.length) {
      const error = new Error("ids required");
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();

    await ResultMaster.update(
      {
        last_sent_at: now,
        last_sent_channel: String(channel || "APP").toUpperCase(),
        last_sent_note: note ? String(note).slice(0, 500) : null,
      },
      { where: { result_id: { [Op.in]: cleanIds } } }
    );

    return { ok: true, sent: cleanIds.length };
  } catch (err) {
    const msg = String(err?.message || "");
    if (msg.includes("Unknown column") || msg.includes("column")) {
      return { ok: true, sent: (ids || []).length, note: "Send simulated (no tracking columns)" };
    }

    const error = new Error(err?.message || err);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};


exports.uploadMarks = async ({ examType, course, semester, subject, marks = [] }) => {
  try {
    const semNumber = safeInt(semester, 1);
    const examName = examType || "Mid Semester";
    const year = new Date().getFullYear();
    const today = new Date().toISOString().slice(0, 10);
    const results = [];

    for (const item of marks) {
      const studentId = safeInt(item.student_id || item.id);
      if (!studentId) continue;

      const studentName = String(item.student_name || item.name || "").trim();
      const enrollment = String(item.roll_no || item.rollNo || item.enrollment || "").trim();
      const obtained = safeNum(item.marks, 0);
      const total = safeNum(item.total_marks || 100, 100);
      const pct = calcPercentage(total, obtained);
      const grade = autoGrade(pct);
      const remark = subject ? `Subject: ${subject}` : "Regular Exam";

      // Check if result record already exists for this student + exam + semester
      const existing = await ResultMaster.findOne({
        where: {
          student_id: studentId,
          exam_name: examName,
          semester: semNumber,
        },
      });

      if (existing) {
        await ResultMaster.update(
          {
            student_name: studentName || existing.student_name,
            enrollment: enrollment || existing.enrollment,
            course: course || existing.course,
            obtained_marks: obtained,
            total_marks: total,
            percentage: pct,
            grade,
            remark,
            published: true,
            declared_on: today,
          },
          { where: { result_id: existing.result_id } }
        );
        results.push({ result_id: existing.result_id, student_id: studentId, status: "updated" });
      } else {
        const created = await ResultMaster.create({
          student_id: studentId,
          student_name: studentName,
          enrollment,
          course: course || "General",
          semester: semNumber,
          exam_name: examName,
          exam_year: year,
          obtained_marks: obtained,
          total_marks: total,
          percentage: pct,
          grade,
          remark,
          published: true,
          declared_on: today,
        });
        results.push({ result_id: created.result_id, student_id: studentId, status: "created" });
      }
    }

    return { total: results.length, data: results };
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};

exports.export = async ({ q = "", filters = {} }) => {
  try {
    const where = buildWhere(q, filters);
    const total = await ResultMaster.count({ where });

    return {
      total,
      url: `${process.env.BASE_URL || "http://localhost:5001"}/exports/results_export.csv`,
    };
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};

exports.my = async (studentId) => {
  try {
    const id = safeInt(studentId);
    if (!id) return [];

    const rows = await ResultMaster.findAll({
      where: {
        student_id: id,
        published: true,
      },
      order: [
        ["semester", "ASC"],
        ["declared_on", "DESC"],
        ["result_id", "DESC"],
      ],
    });

    return rows;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};

exports.getClassMarks = async ({ course, semester, exam_name, examType }) => {
  try {
    const semNumber = safeInt(semester, 0);
    const exam = exam_name || examType;
    const where = {};

    if (course && course !== "ALL") {
      const courseStr = String(course).trim();
      if (courseStr.toUpperCase().includes("BTECH") || courseStr.toUpperCase().includes("B.TECH")) {
        where.course = {
          [Op.or]: [
            { [Op.iLike]: "%B.Tech%" },
            { [Op.iLike]: "%BTech%" },
            { [Op.iLike]: "%BTECH%" },
          ],
        };
      } else {
        where.course = { [Op.iLike]: `%${courseStr}%` };
      }
    }

    if (semNumber) where.semester = semNumber;
    if (exam && exam !== "ALL") where.exam_name = exam;

    return await ResultMaster.findAll({
      where,
      order: [["student_id", "ASC"], ["result_id", "DESC"]],
    });
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};