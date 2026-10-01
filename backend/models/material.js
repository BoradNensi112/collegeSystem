const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const table_name = "material-master";

const Material = sequelize.define(
  table_name,
  {
    id: {
      field: "material_id",
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    
    courseId: {
      field: "course_id",
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    },

    subject: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "",
    },

    semester: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    category: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Notes",
    },

    type: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "PDF",
    },

    visibility: {
      field: "visibility",
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "ALL",
    },

    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    fileUrl: {
      field: "file_path",
      type: Sequelize.STRING,
      allowNull: false,
    },

    faculty: {
      field: "uploaded_by",
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Faculty",
    },

    active: {
      field: "active",
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },

    createdAt: {
      field: "created_at",
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },

    updatedAt: {
      field: "updated_at",
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = Material;