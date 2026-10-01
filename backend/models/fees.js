const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const table_name = "fees-master";

const Fees = sequelize.define(
  table_name,
  {
    fee_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    student_id: {
      type: Sequelize.STRING, 
      allowNull: false,
    },

    student_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    enrollment: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    course: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    semester: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    year: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: new Date().getFullYear(),
    },

    fee_type: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Tuition",
    },

    total_amount: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },

    paid_amount: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },

    due_date: {
      type: Sequelize.DATEONLY, 
      allowNull: false,
    },

    status: {
      type: Sequelize.STRING, 
      allowNull: false,
      defaultValue: "DUE",
    },

    note: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    freezeTableName: true, 
    timestamps: true,      
  }
);

module.exports = Fees;