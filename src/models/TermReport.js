const mongoose = require("mongoose");

const termReportSchema = new mongoose.Schema({
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
  classTeacherComment: { type: String, default: "" },
  principalComment: { type: String, default: "" },
  termAverage: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("TermReport", termReportSchema);
