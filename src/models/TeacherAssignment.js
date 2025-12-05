// models/TeacherAssignment.js
const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    arm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Arm",
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
  },
  { timestamps: true }
);

// prevent duplicates
teacherAssignmentSchema.index(
  { teacher: 1, class: 1, arm: 1, subject: 1 },
  { unique: true }
);

module.exports = mongoose.model("TeacherAssignment", teacherAssignmentSchema);
