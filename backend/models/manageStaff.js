const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const table_name = "manage_staff_master";

const ManageStaff = sequelize.define(
  table_name,
  {
    staff_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    first_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    last_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    user_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },

    email: {
      type: Sequelize.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    mobile_no: {
      type: Sequelize.STRING(15),   
      allowNull: false,
    },

    gender: {
      type: Sequelize.STRING(20),
      allowNull: true,
    },

    designation: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    department: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    qualification: {
      type: Sequelize.STRING(150),
      allowNull: true,
    },

    experience: {
      type: Sequelize.INTEGER,
      allowNull: true, 
    },

    joining_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },

    role: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "FACULTY",
    },

    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    password_hash: {
      type: Sequelize.TEXT,
      allowNull: false,
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
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ManageStaff;