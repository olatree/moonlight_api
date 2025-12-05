const Subject = require("../models/Subject");
const SubjectTeacher = require("../models/SubjectTeacher");
const SubjectClass = require("../models/SubjectClass");
const SubjectAssignment = require("../models/SubjectAssignment");

// Create Subject
exports.createSubject = async (req, res) => {
  try {
    const { name, category, isCompulsory } = req.body;
    const exists = await Subject.findOne({ name });
    if (exists) return res.status(400).json({ message: "Subject already exists" });

    const subject = await Subject.create({ name, category, isCompulsory });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all Subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Subject
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Subject
exports.deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign Subject to Teacher
exports.assignSubjectToTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;
    const subjectId = req.params.id;

    const exists = await SubjectTeacher.findOne({ subject: subjectId, teacher: teacherId });
    if (exists) return res.status(400).json({ message: "Already assigned" });

    const record = await SubjectTeacher.create({ subject: subjectId, teacher: teacherId });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all classes (with arms) offering a subject
exports.getClassesForSubject = async (req, res) => {
  const { subjectId } = req.params;

  try {
    // Find all assignments for this subject
    const assignments = await SubjectAssignment.find({ subject: subjectId })
      .populate("class")
      .populate("arm");

    if (!assignments.length) {
      return res.status(404).json({ error: "No classes found for this subject" });
    }

    // Group arms by class
    const classMap = {};

    assignments.forEach((a) => {
      if (!classMap[a.class._id]) {
        classMap[a.class._id] = {
          classId: a.class._id,
          className: a.class.name,
          arms: [],
        };
      }

      classMap[a.class._id].arms.push({
        armId: a.arm._id,
        armName: a.arm.name,
      });
    });

    const result = Object.values(classMap);

    res.status(200).json(result);
  } catch (error) {
    console.error("getClassesForSubject error:", error);
    res.status(500).json({ error: error.message });
  }
};



// Assign Subject to Class
exports.assignSubjectToClass = async (req, res) => {
  try {
    const { classId } = req.body;
    const subjectId = req.params.id;

    const exists = await SubjectClass.findOne({ subject: subjectId, class: classId });
    if (exists) return res.status(400).json({ message: "Already assigned" });

    const record = await SubjectClass.create({ subject: subjectId, class: classId });
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Teachers of a Subject
exports.getSubjectTeachers = async (req, res) => {
  try {
    const records = await SubjectTeacher.find({ subject: req.params.id }).populate("teacher");
    res.json(records.map(r => r.teacher));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get Classes of a Subject
exports.getSubjectClasses = async (req, res) => {
  try {
    const records = await SubjectClass.find({ subject: req.params.id }).populate("class");
    res.json(records.map(r => r.class));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
