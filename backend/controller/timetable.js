const timeTable = require('../services/timeTable');

//add
exports.postTimetableAdd = async (req, res, next) => {
  try {
    let body = await req.body;
    let db = await timeTable.timeTableInsert(body);


    res.status(200)
      .json({ message: db });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};


//delete
exports.postTimetableDel = async (req, res, next) => {
  try {
    let body = await req.body;


    res.status(200)
      .json({ message: body });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

//edit
exports.postTimetableEdit = async (req, res, next) => {
  try {
    let body = await req.body;


    res.status(200)
      .json({ message: body });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};


//update
exports.postTimetableUp = async (req, res, next) => {
  try {
    let body = await req.body;


    res.status(200)
      .json({ message: body });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

//view all data
exports.postTimetableData = async (req, res, next) => {
  try {
    let data = await timeTable.viewTimetableData(req.body || {});

    res.status(200)
      .json({ message: data });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

//find one
exports.postOneData = async (req, res, next) => {
  try {
    let id = await req.body.id;


    let data = await timeTable.viewTTOneData(id);

    res.status(200)
      .json({ message: data });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

//delete one
exports.postDelete = async (req, res, next) => {
  try {
    let id = await req.body.id;


    let data = await timeTable.deleteData(id);

    res.status(200)
      .json({ message: data });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

exports.postUpdate = async (req, res, next) => {
  try {
    let body = await req.body;


    let data = await timeTable.timeTableUpdate(body);

    res.status(200)
      .json({ message: data });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};





