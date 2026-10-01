const { Op } = require("sequelize");
const sequelize = require("../config/database");
const Course = require("../models/course");
const Subject = require("../models/subject");

class CourseService {

  // CREATE WITH SUBJECTS
  async createCourse(data) {
    const t = await sequelize.transaction();

    try {
      if (!data.course_name) throw new Error("course_name required");
      if (!data.course_code) throw new Error("course_code required");

      const exist = await Course.findOne({
        where: {
          [Op.or]: [
            { course_name: data.course_name },
            { course_code: data.course_code },
          ],
        },
      });

      if (exist) throw new Error("Course already exists");

      const course = await Course.create(
        {
          course_name: data.course_name,
          course_code: data.course_code,
          duration_years: data.duration_years || 3,
          total_semesters: data.total_semesters || 6,
          description: data.description,
          status: data.status || "ACTIVE",
        },
        { transaction: t }
      );

      // subjects insert
      if (Array.isArray(data.subjects)) {
        for (const sub of data.subjects) {
          await Subject.create(
            {
              course_id: course.course_id,
              subject_name: sub.subject_name,
              subject_code: sub.subject_code,
              semester: sub.semester,
              credits: sub.credits || 4,
            },
            { transaction: t }
          );
        }
      }

      await t.commit();
      return course;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  //  LIST WITH SUBJECTS
  async getAllCourses(body = {}) {
    const result = await Course.findAll({
      include: [
        {
          model: Subject,
          as: "subjects",
        },
      ],
      order: [["course_id", "DESC"]],
    });

    return {
      rows: result,
      total: result.length,
    };
  }

  //  GET ONE WITH SUBJECTS
  async getOneCourse(course_id) {
    const course = await Course.findOne({
      where: { course_id },
      include: [{ model: Subject, as: "subjects" }],
    });

    if (!course) throw new Error("Course not found");

    return course;
  }

  //  UPDATE WITH SUBJECTS
  async updateCourse(data) {
    const t = await sequelize.transaction();

    try {
      const course = await Course.findOne({
        where: { course_id: data.course_id },
      });

      if (!course) throw new Error("Course not found");

      await Course.update(
        {
          course_name: data.course_name,
          course_code: data.course_code,
          duration_years: data.duration_years,
          total_semesters: data.total_semesters,
          description: data.description,
          status: data.status,
        },
        { where: { course_id: data.course_id }, transaction: t }
      );

      // delete old subjects
      await Subject.destroy({
        where: { course_id: data.course_id },
        transaction: t,
      });

      // add new subjects
      if (Array.isArray(data.subjects)) {
        for (const sub of data.subjects) {
          await Subject.create(
            {
              course_id: data.course_id,
              subject_name: sub.subject_name,
              subject_code: sub.subject_code,
              semester: sub.semester,
              credits: sub.credits || 4,
            },
            { transaction: t }
          );
        }
      }

      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // DELETE
  async deleteCourse(course_id) {
    await Subject.destroy({ where: { course_id } });
    await Course.destroy({ where: { course_id } });
    return true;
  }
}

module.exports = new CourseService();