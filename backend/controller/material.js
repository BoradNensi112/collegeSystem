const material = require("../services/material");

// ADD
exports.postMaterialAdd = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required. (FormData key must be: file)",
      });
    }

    const db = await material.materialInsert(req);

    return res.status(200).json({
      success: true,
      message: "Material uploaded successfully",
      data: db,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

// VIEW ALL
exports.postMaterialData = async (req, res) => {
  try {
    const data = await material.viewMaterialData();

    return res.status(200).json({
      success: true,
      message: "Material fetched successfully",
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

// VIEW ONE
exports.postOneData = async (req, res) => {
  try {
    const id = req.body.id || req.body.material_id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const data = await material.viewMaterialOneData(id);

    return res.status(200).json({
      success: true,
      message: "Material fetched successfully",
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE
exports.postDelete = async (req, res) => {
  try {
    const id = req.body.id || req.body.material_id;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const affected = await material.deleteData(id);

    return res.status(200).json({
      success: true,
      message: "Material deleted successfully",
      affected,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

// UPDATE
exports.postUpdate = async (req, res) => {
  try {
    const body = req.body || {};

    if (!body?.id && !body?.material_id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const payload = {
      ...body,
      id: body.id || body.material_id,
    };

    if (req.file) {
      payload.fileUrl = `/uploads/material/${req.file.filename}`;
    }

    const affected = await material.materialUpdate(payload);

    return res.status(200).json({
      success: true,
      message: "Material updated successfully",
      affected,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};

// COUNT DISTINCT SUBJECTS BY SEMESTER
exports.postSemesterSummary = async (req, res) => {
  try {
    const { semester } = req.body;

    if (!semester) {
      return res.status(400).json({
        success: false,
        message: "semester is required",
      });
    }

    const data = await material.getSemesterSubjectSummary(semester);

    return res.status(200).json({
      success: true,
      message: "Semester summary fetched successfully",
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  }
};