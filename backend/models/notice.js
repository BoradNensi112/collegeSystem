const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const table_name = "notice-master";

const notice = sequelize.define(
  table_name,
  {
    notice_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    description: {
      type: Sequelize.TEXT, 
      allowNull: false,
    },

    issue_by: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Admin",
    },

    category: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "General",
    },

    audience: {
      type: Sequelize.ENUM("ALL", "STUDENT", "FACULTY"),
      allowNull: false,
      defaultValue: "ALL",
    },

    priority: {
      type: Sequelize.ENUM("LOW", "NORMAL", "HIGH"),
      allowNull: false,
      defaultValue: "NORMAL",
    },

    status: {
      type: Sequelize.ENUM("PUBLISHED", "DRAFT"),
      allowNull: false,
      defaultValue: "PUBLISHED",
    },

    pinned: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    publish_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    attachment_url: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },

    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    freezeTableName: true,
    timestamps: false, 
  }
);

module.exports = notice;