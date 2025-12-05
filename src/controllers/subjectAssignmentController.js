const SubjectAssignment = require("../models/SubjectAssignment");

// // Assign subject to class+arm
// exports.assignSubject = async (req, res) => {
//   try {
//     const { classId, armId, subjectId } = req.body;

//     const exists = await SubjectAssignment.findOne({ 
//       class: classId, 
//       arm: armId, 
//       subject: subjectId 
//     });

//     if (exists) {
//       return res.status(400).json({ message: "Subject already assigned to this class/arm" });
//     }

//     const assignment = new SubjectAssignment({ class: classId, arm: armId, subject: subjectId });
//     await assignment.save();

//     res.status(201).json(assignment);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// Assign multiple subjects to class+arm
exports.assignSubject = async (req, res) => {
  try {
    const { classId, armId, subjectIds } = req.body; // array of IDs

    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ message: "No subjects provided" });
    }

    const createdAssignments = [];

    for (const subjectId of subjectIds) {
      const exists = await SubjectAssignment.findOne({ 
        class: classId, 
        arm: armId, 
        subject: subjectId 
      });

      if (!exists) {
        const assignment = new SubjectAssignment({ class: classId, arm: armId, subject: subjectId });
        await assignment.save();
        createdAssignments.push(assignment);
      }
    }

    if (createdAssignments.length === 0) {
      return res.status(400).json({ message: "All selected subjects already assigned" });
    }

    res.status(201).json(createdAssignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get subjects for a class+arm
exports.getSubjectsForArm = async (req, res) => {
  try {
    const { classId, armId } = req.params;

    const subjects = await SubjectAssignment.find({ class: classId, arm: armId }).populate("subject", "name");

    res.json(subjects);
    // res.json(subjects.map(s => s.subject));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all subject assignments for a class+arm
// exports.getAssignments = async (req, res) => {
// exports.getSubjectsForArm = async (req, res) => {
//   try {
//     const { classId, armId } = req.query;

//     const subjects = await SubjectAssignment.find({ class: classId, arm: armId })
//       .populate("subject", "name"); // 👈 only bring the subject name

//     res.json(subjects);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// Remove subject from class+arm
exports.removeSubject = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    await SubjectAssignment.findByIdAndDelete(assignmentId);

    res.json({ message: "Subject removed from class/arm" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
