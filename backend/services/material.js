const Material = require("../models/material");
const { Sequelize } = require("sequelize");

const toIntOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

exports.materialInsert = async (req) => {
  try {
    if (!req.file) {
      const error = new Error("File is required (field name: file)");
      error.statusCode = 400;
      throw error;
    }

    const title = (req.body.title || "").trim();
    const subject = (req.body.subject || "").trim();
    const semester = toIntOrNull(req.body.semester);
    const courseId = toIntOrNull(req.body.courseId);

    if (!title) {
      const error = new Error("title is required");
      error.statusCode = 400;
      throw error;
    }

    if (semester === null) {
      const error = new Error("semester must be a valid number");
      error.statusCode = 400;
      throw error;
    }

    const fileUrl = `/uploads/material/${req.file.filename}`;

    const db_status = await Material.create({
      title,
      subject,
      courseId,
      semester,
      category: (req.body.category || "Notes").trim(),
      type: (req.body.type || "PDF").trim().toUpperCase(),
      description: (req.body.description || "").trim(),
      fileUrl,
      faculty: (req.body.faculty || "Faculty").trim(),
      visibility: (req.body.visibility || "ALL").trim().toUpperCase(),
      active: true,
      createdAt: new Date(),
      updatedAt: null,
    });

    return db_status;
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

exports.viewMaterialData = async () => {
  try {
    return await Material.findAll({
      order: [["createdAt", "DESC"]],
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 500;
    throw error;
  }
};

exports.viewMaterialOneData = async (id) => {
  try {
    const materialId = Number(id);
    if (Number.isNaN(materialId)) {
      const error = new Error("Invalid material id");
      error.statusCode = 400;
      throw error;
    }

    return await Material.findOne({
      where: { id: materialId },
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

exports.deleteData = async (id) => {
  try {
    const materialId = Number(id);
    if (Number.isNaN(materialId)) {
      const error = new Error("Invalid material id");
      error.statusCode = 400;
      throw error;
    }

    return await Material.destroy({
      where: { id: materialId },
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

exports.materialUpdate = async (body) => {
  try {
    const materialId = Number(body.id);
    if (Number.isNaN(materialId)) {
      const error = new Error("Invalid material id");
      error.statusCode = 400;
      throw error;
    }

    const semester = toIntOrNull(body.semester);
    if (semester === null) {
      const error = new Error("semester must be a valid number");
      error.statusCode = 400;
      throw error;
    }

    const payload = {
      title: (body.title || "").trim(),
      subject: (body.subject || "").trim(),
      courseId: toIntOrNull(body.courseId),
      semester,
      category: (body.category || "Notes").trim(),
      type: (body.type || "PDF").trim().toUpperCase(),
      description: (body.description || "").trim(),
      faculty: (body.faculty || "Faculty").trim(),
      visibility: (body.visibility || "ALL").trim().toUpperCase(),
      updatedAt: new Date(),
    };

    if (body.fileUrl) {
      payload.fileUrl = body.fileUrl;
    }

    return await Material.update(payload, {
      where: { id: materialId },
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

exports.getSemesterSubjectSummary = async (semester) => {
  try {
    const sem = Number(semester);

    if (Number.isNaN(sem)) {
      const error = new Error("semester must be a valid number");
      error.statusCode = 400;
      throw error;
    }

    return await Material.findAll({
      attributes: [
        "semester",
        [
          Sequelize.fn("COUNT", Sequelize.fn("DISTINCT", Sequelize.col("subject"))),
          "totalSubjects",
        ],
      ],
      where: { semester: sem },
      group: ["semester"],
    });
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};