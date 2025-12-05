const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    armId: { type: mongoose.Schema.Types.ObjectId, ref: "Arm", required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    // termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
    // isBlocked: { type: Boolean, default: false },
    isRepeating: { type: Boolean, default: false }, // repeating class
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
