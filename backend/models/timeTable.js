const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const table_name = "timeTable-master";


const TimeTable = sequelize.define(
  table_name,
  {
    timeTable_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    course: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },

    semester: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    batch: {
      type: Sequelize.STRING(30), 
      allowNull: true,
      defaultValue: null,
    },

    subject: {
      type: Sequelize.STRING(120),
      allowNull: false,
    },

    subject_code: {
      type: Sequelize.STRING(30), 
      allowNull: true,
      defaultValue: null,
    },

    day: {
      type: Sequelize.ENUM("MON", "TUE", "WED", "THU", "FRI", "SAT"),
      allowNull: false,
    },

    start_time: {
      type: Sequelize.TIME,
      allowNull: false,
    },

    end_time: {
      type: Sequelize.TIME,
      allowNull: false,
    },

    faculty_name: {
      type: Sequelize.STRING(120),
      allowNull: true,
      defaultValue: null,
    },

    room: {
      type: Sequelize.STRING(50), 
      allowNull: true,
      defaultValue: null,
    },

    type: {
      type: Sequelize.ENUM("LECTURE", "LAB", "TUTORIAL"),
      allowNull: false,
      defaultValue: "LECTURE",
    },

    note: {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    },

    meet_link: {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    },

    status: {
      type: Sequelize.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    freezeTableName: true,
    indexes: [
      { fields: ["course", "semester", "day"] },
      { fields: ["start_time"] },
      { fields: ["end_time"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = TimeTable;