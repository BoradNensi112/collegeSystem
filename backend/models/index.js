// models/index.js
const User = require("./user");
const ResultMaster = require("./result"); // ✅ correct file name

User.hasMany(ResultMaster, { foreignKey: "student_id", as: "results" });
ResultMaster.belongsTo(User, { foreignKey: "student_id", as: "student" });

module.exports = { User, ResultMaster };