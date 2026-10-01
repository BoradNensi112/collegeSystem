const timeTable = require("../models/timeTable");
const { Op } = require("sequelize");

const pick = (obj, keys) => {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== "" && obj[k] !== null && obj[k] !== "ALL") {
      out[k] = obj[k];
    }
  }
  return out;
};

const normalizeDay = (day) => {
  if (!day) return day;
  const d = String(day).trim().toUpperCase();

  const map = {
    MONDAY: "MON",
    TUESDAY: "TUE",
    WEDNESDAY: "WED",
    THURSDAY: "THU",
    FRIDAY: "FRI",
    SATURDAY: "SAT",
    SUN: "SUN", 
  };

  if (map[d]) return map[d];
  if (["MON", "TUE", "WED", "THU", "FRI", "SAT"].includes(d)) return d;

  const asDate = new Date(day);
  if (!isNaN(asDate.getTime())) {
    const k = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][asDate.getDay()];
    if (k === "SUN") return "MON"; 
    return k;
  }

  return "MON"; 
};

const normalizeType = (type) => {
  if (!type) return "LECTURE";
  const t = String(type).trim().toUpperCase();
  if (["LECTURE", "LAB", "TUTORIAL"].includes(t)) return t;
  return "LECTURE";
};

exports.timeTableInsert = async (body) => {
  try {
    const data = await body;

    const payload = {
      course: data.course,
      semester: data.semester,
      batch: data.batch || null, 
      subject: data.subject,
      subject_code: data.subject_code || data.code || null, 
      day: normalizeDay(data.day),
      start_time: data.start_time,
      end_time: data.end_time,
      faculty_name: data.faculty_name || data.faculty || null,
      room: data.room || null, 
      type: normalizeType(data.type), 
      note: data.note || null, 
      meet_link: data.meet_link || data.link || null,
      status: (data.status || "ACTIVE").toUpperCase(), 
    };

    const db_status = await timeTable.create(payload);
    return db_status;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// view all 
exports.viewTimetableData = async (body = {}) => {
  try {
    const data = await body;

    const where = pick(
      {
        course: data.course,
        semester: data.semester,
        batch: data.batch,
        day: data.day ? normalizeDay(data.day) : undefined,
        status: data.status ? String(data.status).toUpperCase() : "ACTIVE",
      },
      ["course", "semester", "batch", "day", "status"]
    );

    if (data.faculty_name || data.faculty) {
      const fName = String(data.faculty_name || data.faculty).trim();
      if (fName && fName !== "ALL") {
        where.faculty_name = { [Op.iLike]: `%${fName}%` };
      }
    }

    if (data.type && data.type !== "ALL") {
      where.type = normalizeType(data.type);
    }

    if (data.search) {
      const q = String(data.search).trim();
      if (q) {
        where[Op.or] = [
          { subject: { [Op.iLike]: `%${q}%` } },
          { subject_code: { [Op.iLike]: `%${q}%` } },
          { room: { [Op.iLike]: `%${q}%` } },
          { faculty_name: { [Op.iLike]: `%${q}%` } },
          { note: { [Op.iLike]: `%${q}%` } },
        ];
      }
    }

    const rows = await timeTable.findAll({
      where,
      order: [
        ["day", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    return rows;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};

//  view one
exports.viewTTOneData = async (id) => {
  try {
    const data = await timeTable.findOne({
      where: { timeTable_id: id },
    });
    return data;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// delete
exports.deleteData = async (id) => {
  try {
    const data = await timeTable.destroy({
      where: { timeTable_id: id },
    });
    return data;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = 500;
    throw error;
  }
};

// update
exports.timeTableUpdate = async (body) => {
  try {
    const data = await body;

    if (!data.timeTable_id) {
      const error = new Error("timeTable_id is required for update");
      error.statusCode = 400;
      throw error;
    }

    const payload = pick(
      {
        course: data.course,
        semester: data.semester,
        batch: data.batch,
        subject: data.subject,
        subject_code: data.subject_code || data.code,
        day: data.day ? normalizeDay(data.day) : undefined,
        start_time: data.start_time,
        end_time: data.end_time,
        faculty_name: data.faculty_name || data.faculty,
        room: data.room,
        type: data.type ? normalizeType(data.type) : undefined,
        note: data.note,
        meet_link: data.meet_link || data.link,
        status: data.status ? String(data.status).toUpperCase() : undefined,
      },
      [
        "course",
        "semester",
        "batch",
        "subject",
        "subject_code",
        "day",
        "start_time",
        "end_time",
        "faculty_name",
        "room",
        "type",
        "note",
        "meet_link",
        "status",
      ]
    );

    const result = await timeTable.update(payload, {
      where: { timeTable_id: data.timeTable_id },
    });

    return result;
  } catch (err) {
    const error = new Error(err?.message || err);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};