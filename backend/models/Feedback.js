const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const FeedbackSession = require("./FeedbackSession");

const Feedback = sequelize.define(
  "feedback",
  {
    feedback_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    session_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    feedback_type: {
      type: DataTypes.ENUM("FACULTY", "COLLEGE"),
      allowNull: false,
    },
    faculty_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "feedback",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["session_id", "student_id", "feedback_type", "faculty_id"],
        name: "uq_feedback_faculty_once",
      },
      {
        unique: true,
        fields: ["session_id", "student_id", "feedback_type"],
        name: "uq_feedback_college_once",
      },
    ],
  }
);

Feedback.belongsTo(FeedbackSession, {
  foreignKey: "session_id",
  as: "session",
});

FeedbackSession.hasMany(Feedback, {
  foreignKey: "session_id",
  as: "feedbacks",
});

module.exports = Feedback;