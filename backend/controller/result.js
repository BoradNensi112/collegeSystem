const resultService = require("../services/result");

// create
exports.create = async (req, res, next) => {
  try {
    const body = req.body;
    const db = await resultService.create(body); // ✅ enrollment -> student_id mapping inside service
    res.status(200).json({ message: "created", data: db });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// update
exports.update = async (req, res, next) => {
  try {
    const body = req.body; // must include result_id
    const db = await resultService.update(body);
    res.status(200).json({ message: "updated", data: db });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// delete
exports.remove = async (req, res, next) => {
  try {
    const result_id = req.body.result_id || req.body.id;
    const db = await resultService.remove(result_id);
    res.status(200).json({ message: "deleted", data: db });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// one
exports.one = async (req, res, next) => {
  try {
    const result_id = req.body.result_id || req.body.id;
    const data = await resultService.one(result_id);
    res.status(200).json({ message: "ok", data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// list
exports.list = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const data = await resultService.list(payload);
    res.status(200).json({ rows: data.rows, total: data.total });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// summary 
exports.summary = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const data = await resultService.summary(payload);
    res.status(200).json(data);
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// toggle
exports.togglePublish = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const data = await resultService.togglePublish(payload);
    res.status(200).json({ message: "ok", data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// bulk POST 
exports.bulk = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const data = await resultService.bulk(payload);
    res.status(200).json({ message: "ok", data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// send 
exports.send = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const data = await resultService.send(payload);
    res.status(200).json({ message: "sent", data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// export 
exports.exportData = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const data = await resultService.export(payload);
    res.status(200).json({ url: data.url, total: data.total });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.my = async (req, res, next) => {
  try {
    const auth = req.auth || {};
    const userType = String(auth.user_type || "").toLowerCase();

    let userId = req.body?.student_id ?? req.body?.user_id ?? auth.sub ?? auth.user_id;

    const idNum = Number(userId);

    if (!idNum || !Number.isFinite(idNum)) {
      const err = new Error("Invalid user id");
      err.statusCode = 401;
      throw err;
    }

    const data = await resultService.my(idNum);

    res.status(200).json({ success: true, data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// upload-marks (Faculty marks entry)
exports.uploadMarks = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const data = await resultService.uploadMarks(payload);
    res.status(200).json({ success: true, message: "Marks uploaded successfully", data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

// get-class-marks (Faculty get existing marks for class)
exports.getClassMarks = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const data = await resultService.getClassMarks(payload);
    res.status(200).json({ success: true, data });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};