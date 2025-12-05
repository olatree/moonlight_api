const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },

  // Continuous Assessments
  ca1: { type: Number, default: 0, min: 0, max: 10 },
  ca2: { type: Number, default: 0, min: 0, max: 10 },
  ca3: { type: Number, default: 0, min: 0, max: 10 },
  ca4: { type: Number, default: 0, min: 0, max: 10 },

  // Exam
  exam: { type: Number, default: 0, min: 0, max: 60 },

  // Computed Fields
  total: { type: Number, default: 0 }, // auto-computed
  grade: { type: String },
  termAverage: { type: Number, default: 0 }, // 🔹 auto-computed & stored

  // Tracking
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: "Term", required: true },
}, { timestamps: true });

// 🔹 Prevent duplicate result entry
resultSchema.index({ enrollmentId: 1, subjectId: 1, sessionId: 1, termId: 1 }, { unique: true });

// 🔹 Grade helper
function computeGrade(score) {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";
  return "F";
}

// 🔹 Pre-save middleware: compute total & grade
resultSchema.pre("save", async function (next) {
  this.total = this.ca1 + this.ca2 + this.ca3 + this.ca4 + this.exam;
  this.grade = computeGrade(this.total);

  // 🔹 After computing this result, update all results in this term with the new term average
  const Result = this.constructor;
  const results = await Result.find({
    enrollmentId: this.enrollmentId,
    sessionId: this.sessionId,
    termId: this.termId,
  });

  if (results.length > 0) {
    const avg = results.reduce((sum, r) =>
      sum + (r._id.equals(this._id) ? this.total : r.total), 0
    ) / results.length;

    // Update all results in this term with the computed average
    await Result.updateMany(
      { enrollmentId: this.enrollmentId, sessionId: this.sessionId, termId: this.termId },
      { $set: { termAverage: Math.round(avg) } }
    );
  }

  next();
});

/**
 * 🔹 Static Method: Compute Termly Results
 */
resultSchema.statics.computeTermly = async function (enrollmentId, sessionId, termId) {
  const results = await this.find({ enrollmentId, sessionId, termId }).populate("subjectId");

  if (results.length === 0) return { termResults: [], termAverage: 0 };

  return {
    termResults: results.map(r => ({
      subject: r.subjectId.name,
      ca1: r.ca1,
      ca2: r.ca2,
      ca3: r.ca3,
      ca4: r.ca4,
      exam: r.exam,
      total: r.total,
      grade: r.grade,
    })),
    termAverage: results[0].termAverage, // already stored
  };
};

/**
 * 🔹 Static Method: Compute Yearly Results (average of 3 terms)
 */
resultSchema.statics.computeYearly = async function (enrollmentId, sessionId) {
  const results = await this.find({ enrollmentId, sessionId }).populate("subjectId");

  if (results.length === 0) return { yearlyResults: [], yearlyAverage: 0 };

  const subjectMap = {};

  results.forEach(r => {
    if (!subjectMap[r.subjectId._id]) subjectMap[r.subjectId._id] = [];
    subjectMap[r.subjectId._id].push(r.total);
  });

  let yearlyResults = [];
  let overallSum = 0;

  for (const [subjectId, scores] of Object.entries(subjectMap)) {
    const yearlyTotal = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const grade = computeGrade(yearlyTotal);

    yearlyResults.push({
      subject: results.find(r => r.subjectId._id.toString() === subjectId).subjectId.name,
      yearlyTotal: Math.round(yearlyTotal),
      grade,
    });

    overallSum += yearlyTotal;
  }

  const yearlyAverage = overallSum / yearlyResults.length;

  return {
    yearlyResults,
    yearlyAverage: Math.round(yearlyAverage),
  };
};

module.exports = mongoose.model("Result", resultSchema);
