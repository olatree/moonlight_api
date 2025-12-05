// controllers/resultController.js
const Result = require("../models/Result");
const Enrollment = require("../models/Enrollment");
const TermReport = require ("../models/TermReport");

// // ----------------------------
// ----------------------------
// Add or Update Results (bulk entry by class)

exports.addOrUpdateResults = async (req, res) => {
  const { classId, subjectId, termId, sessionId, results } = req.body;

  try {
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: "Results array is required" });
    }

    const savedResults = [];

    for (const r of results) {
      let existing = await Result.findOne({
        enrollmentId: r.enrollmentId,
        subjectId,
        termId,
        sessionId,
      });

      // Helper to check if a value is a valid number
      const isValidNumber = (val) =>
        val !== undefined &&
        val !== null &&
        val !== "" &&
        !isNaN(Number(val));

      if (existing) {
        // Only update fields that contain valid numbers
        if (isValidNumber(r.ca1)) existing.ca1 = Number(r.ca1);
        if (isValidNumber(r.ca2)) existing.ca2 = Number(r.ca2);
        if (isValidNumber(r.ca3)) existing.ca3 = Number(r.ca3);
        if (isValidNumber(r.ca4)) existing.ca4 = Number(r.ca4);
        if (isValidNumber(r.exam)) existing.exam = Number(r.exam);
      } else {
        // Create new record (use 0 for any missing/invalid fields)
        existing = new Result({
          enrollmentId: r.enrollmentId,
          subjectId,
          termId,
          sessionId,
          ca1: isValidNumber(r.ca1) ? Number(r.ca1) : 0,
          ca2: isValidNumber(r.ca2) ? Number(r.ca2) : 0,
          ca3: isValidNumber(r.ca3) ? Number(r.ca3) : 0,
          ca4: isValidNumber(r.ca4) ? Number(r.ca4) : 0,
          exam: isValidNumber(r.exam) ? Number(r.exam) : 0,
        });
      }

      // Compute total
      existing.total =
        (existing.ca1 || 0) +
        (existing.ca2 || 0) +
        (existing.ca3 || 0) +
        (existing.ca4 || 0) +
        (existing.exam || 0);

      await existing.save();
      savedResults.push(existing);
    }

    res.status(200).json({ message: "Results saved", results: savedResults });
  } catch (error) {
    console.error("addOrUpdateResults error:", error);
    res.status(500).json({ error: error.message });
  }
};



// ----------------------------
// Get Results for a Class (per subject, per term)
// ----------------------------
exports.getClassResults = async (req, res) => {
  const { subjectId, termId, sessionId, classId } = req.query;

  try {
    // 🔹 Find enrollments in the class + session
    const enrollments = await Enrollment.find({ classId, sessionId })
      .populate("studentId", "name admissionNumber");

    const enrollmentIds = enrollments.map(e => e._id);

    const results = await Result.find({
      enrollmentId: { $in: enrollmentIds },
      subjectId,
      sessionId,
      termId,
    })
      .populate("subjectId", "name")
      .populate({
        path: "enrollmentId",
        populate: { path: "studentId", select: "name admissionNumber" },
      });

    res.status(200).json(results);
  } catch (error) {
    console.error("getClassResults error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------
// Get ALL Results for a Class (All Subjects in that Term)
// ----------------------------
exports.getAllClassResults = async (req, res) => {
  const { termId, sessionId, classId, armId } = req.query;

  try {
    // 🔹 Find all enrollments in this class + arm + session
    const enrollments = await Enrollment.find({ classId, armId, sessionId })
      .populate("studentId", "name admissionNumber");

    if (enrollments.length === 0) {
      return res.status(200).json([]);
    }

    const enrollmentIds = enrollments.map(e => e._id);

    // 🔹 Fetch all results (no subject filter)
    const results = await Result.find({
      enrollmentId: { $in: enrollmentIds },
      sessionId,
      termId,
    })
      .populate("subjectId", "name")
      .populate({
        path: "enrollmentId",
        populate: { path: "studentId", select: "name admissionNumber" },
      });

    // 🔹 Group results by student
    const groupedResults = {};
    for (const r of results) {
      const studentId = r.enrollmentId.studentId._id.toString();
      if (!groupedResults[studentId]) {
        groupedResults[studentId] = {
          student: r.enrollmentId.studentId,
          subjects: [],
        };
      }
      groupedResults[studentId].subjects.push({
        subject: r.subjectId?.name,
        ca1: r.ca1,
        ca2: r.ca2,
        ca3: r.ca3,
        ca4: r.ca4,
        exam: r.exam,
        total: r.total,
        grade: r.grade,
      });
    }

    res.status(200).json(Object.values(groupedResults));
  } catch (error) {
    console.error("getAllClassResults error:", error);
    res.status(500).json({ error: error.message });
  }
};



// ----------------------------
// Get Student Term Results
// ----------------------------
// exports.getStudentTermResults = async (req, res) => {
//   const { enrollmentId, termId, sessionId } = req.query;
//   console.log("📥 Incoming Query:", { enrollmentId, termId, sessionId });

//   try {
//     const results = await Result.find({ enrollmentId, termId, sessionId })
//       .populate("subjectId", "name");

//       console.log("📦 Found Results:", results);

//     const totalSum = results.reduce((sum, r) => sum + (r.total || 0), 0);
//     const termAverage = results.length ? totalSum / results.length : 0;

//     res.status(200).json({ results, termAverage });
//   } catch (error) {
//     console.error("getStudentTermResults error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// ----------------------------
// Get Student Term Results
// ----------------------------
exports.getStudentTermResults = async (req, res) => {
  const { enrollmentId: queryEnrollmentId, userId, sessionId, termId } = req.query;
  // console.log("📥 Incoming Query:", { userId, sessionId, termId });

  try {
    if (!sessionId || !termId) {
      return res.status(400).json({ message: "Session and Term are required." });
    }    

    let enrollmentId = queryEnrollmentId;

    // 🔹 If no enrollmentId provided, get it from logged-in student
    if (!enrollmentId) {
      const studentId = userId; // assumes your auth middleware attaches user
      // console.log("👨‍🎓 Logged-in Student ID:", studentId);
      if (!studentId) {
        return res.status(401).json({ message: "Unauthorized. No student information found." });
      } 

      // find enrollment for this student in the selected session
      const enrollment = await Enrollment.findOne({ studentId, sessionId }).select("_id");
      // console.log("🔍 Found Enrollment:", enrollment);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found for this student in the selected session." });
      }
      enrollmentId = enrollment._id;
      // console.log("🔍 Resolved Enrollment ID:", enrollmentId); // works to this point
    }

    // 🔹 Use your schema's built-in static method
    const { termResults, termAverage } = await Result.computeTermly(enrollmentId, sessionId, termId);

    if (!termResults || termResults.length === 0) {
      return res.status(404).json({ message: "No results found for this term." });
    } 

    const report = await TermReport.findOne({ enrollmentId, termId, sessionId });

    res.status(200).json({
      success: true,
      results: termResults,
      termAverage,
      comments: {
        classTeacher: report?.classTeacherComment || "",
        principal: report?.principalComment || "",
      },
    });

  } catch (error) {
    console.error("Error fetching student term results:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching results.",
      error: error.message,
    });
  }
};

// ----------------------------
// Get Student Yearly Results
// ----------------------------
exports.getStudentYearlyResults = async (req, res) => {
  const { enrollmentId, sessionId } = req.query;

  try {
    const yearly = await Result.computeYearly(enrollmentId, sessionId);
    res.status(200).json(yearly);
  } catch (error) {
    console.error("getStudentYearlyResults error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------
// Get Results By Subject (Class + Arm + Session + Term)
// ----------------------------
// exports.getResultsBySubject = async (req, res) => {
//   const { subjectId, classId, armId, sessionId, termId } = req.query;

//   try {
//     // 1️⃣ Find enrollments for the selected class, arm, and session
//     const enrollments = await Enrollment.find({ classId, armId, sessionId })
//       .populate("studentId", "name admissionNumber");

//     const enrollmentIds = enrollments.map(e => e._id);

//     // 2️⃣ Get results for that subject and those enrollments
//     const results = await Result.find({
//       enrollmentId: { $in: enrollmentIds },
//       subjectId,
//       sessionId,
//       termId,
//     })
//       .populate("subjectId", "name")
//       .populate({
//         path: "enrollmentId",
//         populate: { path: "studentId", select: "name admissionNumber" },
//       });

//     // 3️⃣ Transform response (student details + scores)
//     const formatted = results.map(r => ({
//       student: {
//         id: r.enrollmentId.studentId._id,
//         name: r.enrollmentId.studentId.name,
//         admissionNumber: r.enrollmentId.studentId.admissionNumber,
//       },
//       subject: r.subjectId.name,
//       ca1: r.ca1,
//       ca2: r.ca2,
//       ca3: r.ca3,
//       ca4: r.ca4,
//       exam: r.exam,
//       total: r.total,
//       grade: r.grade,
//     }));

//     res.status(200).json(formatted);
//   } catch (error) {
//     console.error("getResultsBySubject error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };
// Revised version to include all students even if they don't have results yet

exports.getResultsBySubject = async (req, res) => {
  const { subjectId, classId, armId, sessionId, termId } = req.query;

  try {
    // 1️⃣ Get all enrollments for the class, arm, and session
    const enrollments = await Enrollment.find({ classId, armId, sessionId })
      .populate("studentId", "name admissionNumber");

    if (!enrollments.length) {
      return res.status(404).json({ message: "No students enrolled" });
    }

    const enrollmentIds = enrollments.map(e => e._id);

    // 2️⃣ Get existing results for those enrollments
    const results = await Result.find({
      enrollmentId: { $in: enrollmentIds },
      subjectId,
      sessionId,
      termId,
    });

    // 3️⃣ Merge enrollment list with results
    const formatted = enrollments.map((enroll) => {
      const existing = results.find(
        (r) => r.enrollmentId.toString() === enroll._id.toString()
      );

      return {
        enrollmentId: enroll._id,
        student: {
          id: enroll.studentId._id,
          name: enroll.studentId.name,
          admissionNumber: enroll.studentId.admissionNumber,
        },
        subjectId,
        termId,
        sessionId,
        ca1: existing ? existing.ca1 : "",
        ca2: existing ? existing.ca2 : "",
        ca3: existing ? existing.ca3 : "",
        ca4: existing ? existing.ca4 : "",
        exam: existing ? existing.exam : "",
        total: existing ? existing.total : "",
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getResultsBySubject error:", error);
    res.status(500).json({ error: error.message });
  }
};
