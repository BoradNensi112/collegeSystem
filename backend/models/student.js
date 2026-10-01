const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const table_name = "student-masters";

const Student = sequelize.define(
  table_name,
  {
    student_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    enrollment_no: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    course: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    semester: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    status: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = Student;