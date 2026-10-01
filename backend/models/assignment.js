const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const Assignment = sequelize.define(
  "assignment_master",
  {
    assignment_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    subject: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    class_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    sem: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },

    file_url: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Stored as /uploads/assignments/file.pdf",
    },

    file_name: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    due_date: {
      type: Sequelize.DATE,
      allowNull: false,
    },

    total_marks: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },

    status: {
      type: Sequelize.ENUM("ACTIVE", "CLOSED"),
      defaultValue: "ACTIVE",
    },

    allow_resubmit: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },

    created_by: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Faculty name or ID",
    },

    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },

    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,

    hooks: {
      beforeUpdate: (assignment) => {
        assignment.updated_at = new Date();
      },
    },
  }
);

module.exports = Assignment;