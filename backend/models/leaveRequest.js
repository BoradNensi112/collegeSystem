const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); 

const LeaveRequest = sequelize.define(
  "leave_request",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    leave_type: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },

    from_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    to_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    priority: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Normal",
    },

    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Pending",
    },

    faculty_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    total_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "leave_request",
    timestamps: false,
  }
);

module.exports = LeaveRequest;