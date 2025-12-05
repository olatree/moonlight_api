const mongoose = require("mongoose");

const subjectAssignmentSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("SubjectAssignment", subjectAssignmentSchema);
