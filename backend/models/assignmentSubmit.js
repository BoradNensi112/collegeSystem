const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const AssignmentSubmit = sequelize.define(
  "assignment_submit",
  {
    submit_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    assignment_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    student_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    link: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    file_url: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    file_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "SUBMITTED",
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = AssignmentSubmit;