const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const Course = require("./course");

const Subject = sequelize.define(
  "subject-master",
  {
    subject_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    course_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    subject_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    subject_code: {
      type: Sequelize.STRING,
    },
    semester: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    credits: {
      type: Sequelize.INTEGER,
      defaultValue: 4,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// relation
Course.hasMany(Subject, { foreignKey: "course_id", as: "subjects" });
Subject.belongsTo(Course, { foreignKey: "course_id" });

module.exports = Subject;