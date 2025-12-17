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
// Get Results by Subject for a Class
// ----------------------------

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


// ----------------------------
// Delete a Result
// ----------------------------
// exports.deleteResult = async (req, res) => {
//   const { enrollmentId, subjectId, termId, sessionId } = req.body;

//   try {
//     if (!enrollmentId || !subjectId || !termId || !sessionId) {
//       return res.status(400).json({ message: "Enrollment, Subject, Term, and Session are required." });
//     }

//     const deleted = await Result.findOneAndDelete({
//       enrollmentId,
//       subjectId,
//       termId,
//       sessionId,
//     });

//     if (!deleted) {
//       return res.status(404).json({ message: "Result not found." });
//     }

//     res.status(200).json({ message: "Result deleted successfully.", deleted });
//   } catch (error) {
//     console.error("deleteResult error:", error);
//     res.status(500).json({ error: error.message });
//   }
// };


// ----------------------------
// Delete ALL results by selection
// ----------------------------
exports.deleteResultsBySelection = async (req, res) => {
  const { subjectId, classId, armId, sessionId, termId } = req.body;

  try {
    if (!subjectId || !classId || !armId || !sessionId || !termId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // 1️⃣ Find all enrollments for class + arm + session
    const enrollments = await Enrollment.find({ classId, armId, sessionId }).select("_id");
    const enrollmentIds = enrollments.map(e => e._id);

    if (enrollmentIds.length === 0) {
      return res.status(404).json({ message: "No enrollments found." });
    }

    // 2️⃣ Delete results for these enrollments AND subject
    const deleted = await Result.deleteMany({
      enrollmentId: { $in: enrollmentIds },
      subjectId,
      sessionId,
      termId,
    });

    res.status(200).json({
      message: `Deleted ${deleted.deletedCount} result(s).`,
    });
  } catch (error) {
    console.error("deleteResultsBySelection error:", error);
    res.status(500).json({ error: error.message });
  }
};


// ----------------------------
// Delete a single result
// ----------------------------
exports.deleteSingleResult = async (req, res) => {
  const { resultId } = req.params;

  try {
    const deleted = await Result.findByIdAndDelete(resultId);

    if (!deleted) {
      return res.status(404).json({ message: "Result not found." });
    }

    res.status(200).json({ message: "Result deleted." });
  } catch (error) {
    console.error("deleteSingleResult error:", error);
    res.status(500).json({ error: error.message });
  }
};


// ----------------------------
// Get Results by Student
// ----------------------------
exports.getResultsByStudent = async (req, res) => {
  const { studentId, sessionId, termId } = req.query;

  try {
    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    // Build query object
    const query = { studentId };
    if (sessionId) query.sessionId = sessionId;

    // 1️⃣ Find enrollment(s) for this student
    const enrollments = await Enrollment.find(query)
      .populate("classId", "name")
      .populate("armId", "name")
      .populate("sessionId", "year");

    if (!enrollments.length) {
      return res.status(404).json({ 
        message: "No enrollments found for this student." 
      });
    }

    const enrollmentIds = enrollments.map(e => e._id);

    // 2️⃣ Build results query
    const resultsQuery = {
      enrollmentId: { $in: enrollmentIds },
    };
    if (sessionId) resultsQuery.sessionId = sessionId;
    if (termId) resultsQuery.termId = termId;

    // 3️⃣ Fetch all results for these enrollments
    const results = await Result.find(resultsQuery)
      .populate("subjectId", "name")
      .populate("termId", "name")
      .populate("sessionId", "year")
      .populate({
        path: "enrollmentId",
        populate: [
          { path: "classId", select: "name" },
          { path: "armId", select: "name" },
        ],
      })
      .sort({ sessionId: -1, termId: 1, "subjectId.name": 1 });

    if (!results.length) {
      return res.status(404).json({ 
        message: "No results found for this student." 
      });
    }

    // 4️⃣ Group results by session and term
    const groupedResults = {};

    for (const result of results) {
      const sessionYear = result.sessionId?.year || "Unknown Session";
      const termName = result.termId?.name || "Unknown Term";
      const key = `${sessionYear} - ${termName}`;

      if (!groupedResults[key]) {
        groupedResults[key] = {
          session: sessionYear,
          term: termName,
          class: result.enrollmentId?.classId?.name || "N/A",
          arm: result.enrollmentId?.armId?.name || "N/A",
          subjects: [],
          totalScore: 0,
          subjectCount: 0,
        };
      }

      groupedResults[key].subjects.push({
        subject: result.subjectId?.name || "Unknown Subject",
        ca1: result.ca1,
        ca2: result.ca2,
        ca3: result.ca3,
        ca4: result.ca4,
        exam: result.exam,
        total: result.total,
        grade: result.grade,
      });

      groupedResults[key].totalScore += result.total || 0;
      groupedResults[key].subjectCount += 1;
    }

    // 5️⃣ Calculate averages
    const formattedResults = Object.values(groupedResults).map(group => ({
      ...group,
      average: group.subjectCount > 0 
        ? (group.totalScore / group.subjectCount).toFixed(2) 
        : 0,
    }));

    res.status(200).json({
      success: true,
      studentId,
      totalRecords: results.length,
      results: formattedResults,
    });

  } catch (error) {
    console.error("getResultsByStudent error:", error);
    res.status(500).json({ error: error.message });
  }
};


// ----------------------------
// Get Complete Student Academic Profile
// ----------------------------
exports.getStudentAcademicProfile = async (req, res) => {
  const { studentId, sessionId } = req.query;

  try {
    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    // 1️⃣ Get student basic info
    const Student = require("../models/Student");
    const student = await Student.findById(studentId).select(
      "name admissionNumber dateOfBirth gender"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // 2️⃣ Get enrollments
    const query = { studentId };
    if (sessionId) query.sessionId = sessionId;

    const enrollments = await Enrollment.find(query)
      .populate("classId", "name")
      .populate("armId", "name")
      .populate("sessionId", "year")
      .sort({ sessionId: -1 });

    if (!enrollments.length) {
      return res.status(404).json({ 
        message: "No enrollment history found for this student." 
      });
    }

    // 3️⃣ Get all results for all enrollments
    const enrollmentIds = enrollments.map(e => e._id);
    const resultsQuery = {
      enrollmentId: { $in: enrollmentIds },
    };
    if (sessionId) resultsQuery.sessionId = sessionId;

    const results = await Result.find(resultsQuery)
      .populate("subjectId", "name")
      .populate("termId", "name")
      .populate("sessionId", "year");

    // 4️⃣ Get term reports (comments)
    const reports = await TermReport.find({
      enrollmentId: { $in: enrollmentIds },
    })
      .populate("termId", "name")
      .populate("sessionId", "year");

    // 5️⃣ Organize data by session
    const academicHistory = [];

    for (const enrollment of enrollments) {
      const sessionResults = results.filter(
        r => r.enrollmentId.toString() === enrollment._id.toString()
      );

      const sessionReports = reports.filter(
        rep => rep.enrollmentId.toString() === enrollment._id.toString()
      );

      // Group by term
      const termData = {};
      for (const result of sessionResults) {
        const termName = result.termId?.name || "Unknown Term";
        
        if (!termData[termName]) {
          termData[termName] = {
            term: termName,
            subjects: [],
            totalScore: 0,
            subjectCount: 0,
          };
        }

        termData[termName].subjects.push({
          subject: result.subjectId?.name,
          ca1: result.ca1,
          ca2: result.ca2,
          ca3: result.ca3,
          ca4: result.ca4,
          exam: result.exam,
          total: result.total,
          grade: result.grade,
        });

        termData[termName].totalScore += result.total || 0;
        termData[termName].subjectCount += 1;
      }

      // Add comments to term data
      for (const report of sessionReports) {
        const termName = report.termId?.name;
        if (termData[termName]) {
          termData[termName].classTeacherComment = report.classTeacherComment;
          termData[termName].principalComment = report.principalComment;
        }
      }

      // Calculate term averages
      const terms = Object.values(termData).map(term => ({
        ...term,
        average: term.subjectCount > 0 
          ? (term.totalScore / term.subjectCount).toFixed(2) 
          : 0,
      }));

      academicHistory.push({
        session: enrollment.sessionId?.year,
        class: enrollment.classId?.name,
        arm: enrollment.armId?.name,
        terms,
      });
    }

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
      },
      academicHistory,
    });

  } catch (error) {
    console.error("getStudentAcademicProfile error:", error);
    res.status(500).json({ error: error.message });
  }
};