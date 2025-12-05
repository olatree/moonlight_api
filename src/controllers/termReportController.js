const TermReport = require("../models/TermReport");
const Enrollment = require("../models/Enrollment");

// ----------------------------
// POST /api/term-reports/class-teacher
// ----------------------------
exports.saveClassTeacherComments = async (req, res) => {
  try {
    const { reports } = req.body;
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({ message: "Invalid data format." });
    }

    const saved = [];

    for (const r of reports) {
      const {
        studentId,
        classId,
        armId,
        sessionId,
        termId,
        classTeacherComment,
      } = r;

      // Find enrollment record
      const enrollment = await Enrollment.findOne({ studentId, sessionId });
      if (!enrollment) {
        console.warn(`No enrollment found for student ${studentId} in session ${sessionId}`);
        continue;
      }

      // Check for existing report
      let report = await TermReport.findOne({
        enrollmentId: enrollment._id,
        sessionId,
        termId,
      });

      if (report) {
        report.classTeacherComment = classTeacherComment;
        await report.save();
      } else {
        report = await TermReport.create({
          enrollmentId: enrollment._id,
          sessionId,
          termId,
          classTeacherComment,
        });
      }

      saved.push(report);
    }

    res.json({ message: "Class teacher comments saved successfully.", saved });
  } catch (err) {
    console.error("Error saving teacher comments:", err);
    res.status(500).json({ message: "Server error while saving comments." });
  }
};

// ----------------------------
// POST /api/term-reports/principal
// ----------------------------
exports.savePrincipalComments = async (req, res) => {
  try {
    const { reports } = req.body;
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({ message: "Invalid data format." });
    }

    const saved = [];

    for (const r of reports) {
      const {
        studentId,
        classId,
        armId,
        sessionId,
        termId,
        principalComment,
      } = r;

      // Find enrollment record
      const enrollment = await Enrollment.findOne({ studentId, sessionId });
      if (!enrollment) {
        console.warn(`No enrollment found for student ${studentId} in session ${sessionId}`);
        continue;
      }

      // Check for existing report
      let report = await TermReport.findOne({
        enrollmentId: enrollment._id,
        sessionId,
        termId,
      });

      if (report) {
        report.principalComment = principalComment;
        await report.save();
      } else {
        report = await TermReport.create({
          enrollmentId: enrollment._id,
          sessionId,
          termId,
          principalComment,
        });
      }

      saved.push(report);
    }

    res.json({ message: "Principal comments saved successfully.", saved });
  } catch (err) {
    console.error("Error saving principal comments:", err);
    res.status(500).json({ message: "Server error while saving comments." });
  }
};

// ----------------------------
// GET /api/term-reports
// ----------------------------
// exports.getTermReports = async (req, res) => {
//   try {
//     const { classId, armId, sessionId, termId } = req.query;

//     const filter = {};
//     if (classId) filter.classId = classId;
//     if (armId) filter.armId = armId;
//     if (sessionId) filter.sessionId = sessionId;
//     if (termId) filter.termId = termId;

//     const reports = await TermReport.find(filter)
//       .populate({
//         path: "enrollmentId",
//         populate: { path: "studentId", select: "firstName lastName middleName" },
//       })
//       .populate("sessionId", "name")
//       .populate("termId", "name");

//     res.json({ reports });
//   } catch (err) {
//     console.error("Error fetching term reports:", err);
//     res.status(500).json({ message: "Server error fetching term reports." });
//   }
// };

exports.getTermReports = async (req, res) => {
  try {
    const { classId, armId, sessionId, termId } = req.query;

    // 🟩 Find enrollments matching this class, arm, session
    const enrollments = await Enrollment.find({ classId, armId, sessionId }).select("_id studentId");
    const enrollmentIds = enrollments.map((e) => e._id);

    // 🟩 Find term reports for those enrollments
    const reports = await TermReport.find({
      enrollmentId: { $in: enrollmentIds },
      sessionId,
      termId,
    })
      .populate({
        path: "enrollmentId",
        populate: { path: "studentId", select: "name" },
      })
      .populate("sessionId", "name")
      .populate("termId", "name");

    res.json({ reports });
  } catch (err) {
    console.error("Error fetching term reports:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ----------------------------
// GET /api/term-reports/:enrollmentId
// ----------------------------
exports.getStudentReport = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const report = await TermReport.findOne({ enrollmentId })
      .populate("sessionId", "name")
      .populate("termId", "name");

    if (!report) {
      return res.status(404).json({ message: "No term report found for this student." });
    }

    res.json({ report });
  } catch (err) {
    console.error("Error fetching student report:", err);
    res.status(500).json({ message: "Server error fetching student report." });
  }
};
