const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const table_name = "user-master";

const User = sequelize.define(
  table_name,
  {
    user_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    first_name: { type: Sequelize.STRING, allowNull: false },
    last_name: { type: Sequelize.STRING, allowNull: false },

    user_name: { type: Sequelize.STRING, allowNull: false, unique: true },
    email: { type: Sequelize.STRING, allowNull: false, unique: true },

    password: { type: Sequelize.TEXT, allowNull: false },

    course: { type: Sequelize.STRING, allowNull: true },
    sem: { type: Sequelize.INTEGER, allowNull: true },

    enrollment: { type: Sequelize.STRING, allowNull: true, unique: true },

    mobile: { type: Sequelize.STRING, allowNull: true },
    father_name: { type: Sequelize.STRING, allowNull: true },
    father_mobile: { type: Sequelize.STRING, allowNull: true },
    dob: { type: Sequelize.STRING, allowNull: true },

    user_type: { type: Sequelize.STRING, allowNull: false },

    department: { type: Sequelize.STRING, allowNull: true },
    qualification: { type: Sequelize.STRING, allowNull: true },
    experience: { type: Sequelize.STRING, allowNull: true },
  },
  {
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = User;