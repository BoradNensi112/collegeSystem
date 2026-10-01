const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const table_name = "attendence-master";

const attendence = sequelize.define(
  table_name,
  {
    attendence_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    student_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    roll_no: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    department_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    course: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    semester: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    attendance_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },

    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "1=Present, 2=Absent, 3=Late, 4=Leave",
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = attendence;