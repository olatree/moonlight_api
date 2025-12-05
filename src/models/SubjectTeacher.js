// server/src/models/SubjectTeacher.js
const mongoose = require("mongoose");

const subjectTeacherSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubjectTeacher", subjectTeacherSchema);
