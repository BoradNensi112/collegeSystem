const courseService = require("../services/course");

exports.create = async (req, res) => {
  try {
    const result = await courseService.createCourse(req.body);

    res.json({
      success: true,
      message: "Course + Subjects created",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.list = async (req, res) => {
  const result = await courseService.getAllCourses(req.body);
  res.json({ success: true, ...result });
};

exports.one = async (req, res) => {
  const result = await courseService.getOneCourse(req.body.course_id);
  res.json({ success: true, data: result });
};

exports.update = async (req, res) => {
  await courseService.updateCourse(req.body);
  res.json({ success: true, message: "Updated" });
};

exports.remove = async (req, res) => {
  await courseService.deleteCourse(req.body.course_id);
  res.json({ success: true, message: "Deleted" });
};