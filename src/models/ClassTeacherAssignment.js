// const mongoose = require("mongoose");

// const classTeacherAssignmentSchema = new mongoose.Schema(
//   {
//     teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
//     classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
//     armId: { type: mongoose.Schema.Types.ObjectId, ref: "Arm", required: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("ClassTeacherAssignment", classTeacherAssignmentSchema);


const mongoose = require("mongoose");

const classTeacherAssignmentSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅ Now points to User
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    armId: { type: mongoose.Schema.Types.ObjectId, ref: "Arm", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassTeacherAssignment", classTeacherAssignmentSchema);
