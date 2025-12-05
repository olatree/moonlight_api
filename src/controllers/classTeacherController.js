// const ClassTeacherAssignment = require("../models/ClassTeacherAssignment");

// // ➡ Assign class teacher
// exports.assignClassTeacher = async (req, res) => {
//   try {
//     const { teacherId, classId, armId } = req.body;

//     // Prevent duplicates (only one teacher per class+arm)
//     const exists = await ClassTeacherAssignment.findOne({ classId, armId });
//     if (exists) {
//       return res.status(400).json({ message: "A teacher is already assigned to this class & arm" });
//     }

//     const assignment = new ClassTeacherAssignment({ teacher: teacherId, classId, armId });
//     await assignment.save();

//     res.status(201).json({ message: "Class teacher assigned successfully", assignment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ➡ Get all assignments
// exports.getAllClassTeachers = async (req, res) => {
//   try {
//     const assignments = await ClassTeacherAssignment.find()
//       .populate("teacher", "name email phone")
//       .populate("classId", "name")
//       .populate("armId", "name");

//     res.json(assignments);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ➡ Get teacher for a specific class+arm
// exports.getClassTeacher = async (req, res) => {
//   try {
//     const { classId, armId } = req.params;
//     const assignment = await ClassTeacherAssignment.findOne({ classId, armId })
//       .populate("teacher", "name email phone");

//     if (!assignment) return res.status(404).json({ message: "No teacher assigned" });

//     res.json(assignment);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // DELETE /api/class-teachers/:id
// exports.deleteClassTeacher = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const assignment = await ClassTeacherAssignment.findById(id);
//     if (!assignment) {
//       return res.status(404).json({ message: "Assignment not found" });
//     }

//     await assignment.deleteOne();

//     res.json({ message: "Class teacher unassigned successfully" });
//   } catch (err) {
//     console.error("Error deleting assignment:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const ClassTeacherAssignment = require("../models/ClassTeacherAssignment");
const User = require("../models/User");

// ➡ Assign class teacher
exports.assignClassTeacher = async (req, res) => {
  try {
    const { teacherId, classId, armId } = req.body;

    // Ensure the teacher exists & is actually a teacher
    const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
    if (!teacher) {
      return res.status(404).json({ message: "Invalid teacher selected" });
    }

    // Prevent duplicates (only one teacher per class+arm)
    const exists = await ClassTeacherAssignment.findOne({ classId, armId });
    if (exists) {
      return res
        .status(400)
        .json({ message: "A teacher is already assigned to this class & arm" });
    }

    const assignment = new ClassTeacherAssignment({ teacher: teacherId, classId, armId });
    await assignment.save();

    res.status(201).json({ message: "Class teacher assigned successfully", assignment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➡ Get all assignments
exports.getAllClassTeachers = async (req, res) => {
  try {
    const assignments = await ClassTeacherAssignment.find()
      .populate("teacher", "name email phone picture signature") // ✅ Now pulls from User
      .populate("classId", "name")
      .populate("armId", "name");

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➡ Get teacher for a specific class+arm
exports.getClassTeacher = async (req, res) => {
  try {
    const { classId, armId } = req.params;
    const assignment = await ClassTeacherAssignment.findOne({ classId, armId })
      .populate("teacher", "name email phone picture signature");

    if (!assignment) return res.status(404).json({ message: "No teacher assigned" });

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/class-teachers/:id
exports.deleteClassTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await ClassTeacherAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await assignment.deleteOne();

    res.json({ message: "Class teacher unassigned successfully" });
  } catch (err) {
    console.error("Error deleting assignment:", err);
    res.status(500).json({ message: "Server error" });
  }
};
