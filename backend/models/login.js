const Sequelize = require('sequelize');
const sequelize = require('../config/database')
const table_name = "login-master";

const Login = sequelize.define(table_name, {
  login_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },

  user_name: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  password: {
    type: Sequelize.TEXT,
    allowNull: false,
  }


});

module.exports = Login;