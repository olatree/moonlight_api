// models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    armId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Arm",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    termId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Term",
      required: true,
    },

    // Global attendance info (same for all students)
    timesOpened: {
      type: Number,
      required: true,
      min: 0,
    },

    // Per student attendance
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        timesPresent: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Clean up old indexes automatically
attendanceSchema.pre('init', async function () {
  const model = mongoose.model('Attendance');
  try {
    const indexes = await model.collection.indexes();
    const oldIndex = indexes.find(idx => idx.key.enrollmentId);
    if (oldIndex) {
      console.log("⚙️ Removing old enrollmentId index:", oldIndex.name);
      await model.collection.dropIndex(oldIndex.name);
      console.log("✅ Old index removed successfully.");
    }
  } catch (err) {
    console.warn("⚠️ Could not check or drop old indexes:", err.message);
  }
});


// One record per class/arm/session/term
attendanceSchema.index(
  { classId: 1, armId: 1, sessionId: 1, termId: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
