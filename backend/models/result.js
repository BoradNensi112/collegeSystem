const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const table_name = "result-master"; // (agar tumhari DB me yahi exact name hai)

const ResultMaster = sequelize.define(
  table_name,
  {
    result_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
      field: "Result_id", // 
    },

    student_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      field: "student_id",
    },

    student_name: {
      type: Sequelize.STRING(120),
      allowNull: true,
      field: "student_name",
    },

    enrollment: {
      type: Sequelize.STRING(50),
      allowNull: true,
      field: "enrollment",
    },

    course: {
      type: Sequelize.STRING(50),
      allowNull: true,
      field: "course",
    },

    semester: {
      type: Sequelize.INTEGER,
      allowNull: true,
      field: "semester",
    },

    exam_name: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "Mid Sem",
      field: "exam_name",
    },

    exam_year: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: new Date().getFullYear(),
      field: "exam_year",
    },

    obtained_marks: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "obtained_marks",
    },

    total_marks: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "total_marks",
    },

    percentage: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "percentage",
    },

    grade: {
      type: Sequelize.STRING(5),
      allowNull: true,
      field: "grade",
    },

    remark: {
      type: Sequelize.TEXT,
      allowNull: true,
      field: "remark",
    },

    published: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "published",
    },

    declared_on: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      field: "declared_on",
    },
  },
  {
    freezeTableName: true, 
    timestamps: true,      
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ResultMaster;