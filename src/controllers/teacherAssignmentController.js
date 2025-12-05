// controllers/teacherAssignmentController.js
const TeacherAssignment = require("../models/TeacherAssignment");

// Assign multiple subjects
exports.assignSubjects = async (req, res) => {
  try {
    const { teacherId, classId, armId, subjectIds } = req.body;

    if (!teacherId || !classId || !armId || !subjectIds || subjectIds.length === 0) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const assignments = await Promise.all(
      subjectIds.map(async (subjectId) => {
        try {
          const assignment = await TeacherAssignment.findOneAndUpdate(
            { teacher: teacherId, class: classId, arm: armId, subject: subjectId },
            { teacher: teacherId, class: classId, arm: armId, subject: subjectId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          return assignment;
        } catch (err) {
          return null; // skip duplicate conflicts
        }
      })
    );

    res.status(201).json(assignments.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: "Error assigning subjects", error: error.message });
  }
};

// Get assignments for a teacher in a class+arm
exports.getAssignments = async (req, res) => {
  try {
    const { teacherId, classId, armId } = req.params;
    const assignments = await TeacherAssignment.find({
      teacher: teacherId,
      class: classId,
      arm: armId,
    }).populate("subject", "name");

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments", error: error.message });
  }
};

// Delete an assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await TeacherAssignment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Assignment not found" });
    res.json({ message: "Assignment removed" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assignment", error: error.message });
  }
};

// Get all subjects assigned to a teacher
exports.getTeacherSubjects = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const subjects = await TeacherAssignment.find({ teacher: teacherId })
      .populate("subject", "name")
      .select("subject");

    // remove duplicates
    const uniqueSubjects = [
      ...new Map(subjects.map((a) => [a.subject._id, a.subject])).values(),
    ];

    res.json(uniqueSubjects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teacher subjects", error: err.message });
  }
};

// Get classes for a subject assigned to a teacher
exports.getTeacherClasses = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.params;
    const assignments = await TeacherAssignment.find({
      teacher: teacherId,
      subject: subjectId,
    }).populate("class", "name");

    const uniqueClasses = [
      ...new Map(assignments.map((a) => [a.class._id, a.class])).values(),
    ];

    res.json(uniqueClasses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teacher classes", error: err.message });
  }
};

// Get arms for a subject+class assigned to a teacher
exports.getTeacherArms = async (req, res) => {
  try {
    const { teacherId, subjectId, classId } = req.params;
    const assignments = await TeacherAssignment.find({
      teacher: teacherId,
      subject: subjectId,
      class: classId,
    }).populate("arm", "name");

    const uniqueArms = [
      ...new Map(assignments.map((a) => [a.arm._id, a.arm])).values(),
    ];

    res.json(uniqueArms);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teacher arms", error: err.message });
  }
};
