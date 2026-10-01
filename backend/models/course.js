const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Course = sequelize.define(
  "course-master",
  {
    course_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    course_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    course_code: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    duration_years: {
      type: Sequelize.INTEGER,
      defaultValue: 3,
    },
    total_semesters: {
      type: Sequelize.INTEGER,
      defaultValue: 6,
    },
    description: {
      type: Sequelize.TEXT,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: "ACTIVE",
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Course;