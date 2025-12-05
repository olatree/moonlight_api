// controllers/attendanceController.js
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Enrollment = require("../models/Enrollment");

// exports.getAttendanceSummary = async (req, res) => {
//   try {
//     const { classId, armId, sessionId, termId } = req.query;
//     console.log("Query Recieved:", req.query);
    

//     const attendance = await Attendance.findOne({
//       classId,
//       armId,
//       sessionId,
//       termId,
//     }).populate("records.studentId", "name admissionNumber");
//     console.log("Attendance Record Found:", attendance);

//     if (!attendance) {
//       // If no attendance, get students for new record
//       const students = await Student.find({ classId, armId, archived: false });
//       return res.json({
//         timesOpened: "N/A",
//         records: students.map((s) => ({
//           studentId: s._id,
//           name: s.name,
//           admissionNumber: s.admissionNumber,
//           timesPresent: 0,
//         })),
//       });
//     }

//     // Return existing record
//     const data = attendance.records.map((r) => ({
//       studentId: r.studentId._id,
//       name: r.studentId.name,
//       admissionNumber: r.studentId.admissionNumber,
//       timesPresent: r.timesPresent,
//     }));

//     res.json({
//       timesOpened: attendance.timesOpened,
//       records: data,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { classId, armId, sessionId, termId } = req.query;

    // Find attendance record for this class-arm-session-term
    const attendance = await Attendance.findOne({
      classId,
      armId,
      sessionId,
      termId,
    }).populate("records.studentId", "name admissionNumber image");

    if (!attendance) {
      // If no attendance record exists, fetch students from ENROLLMENT
      const enrollments = await Enrollment.find({
        classId,
        armId,
        sessionId,
      }).populate("studentId", "name admissionNumber image");

      if (!enrollments.length)
        return res.json({
          timesOpened: "N/A",
          records: [],
        });

      // Build initial attendance records
      const records = enrollments.map((en) => ({
        studentId: en.studentId._id,
        name: en.studentId.name,
        admissionNumber: en.studentId.admissionNumber,
        image: en.studentId.image || null,
        timesPresent: 0,
      }));

      return res.json({
        timesOpened: "N/A",
        records,
      });
    }

    // If attendance already exists, format it
    const data = attendance.records.map((r) => ({
      studentId: r.studentId._id,
      name: r.studentId.name,
      admissionNumber: r.studentId.admissionNumber,
      image: r.studentId.image || null,
      timesPresent: r.timesPresent,
    }));

    res.json({
      timesOpened: attendance.timesOpened,
      records: data,
    });
  } catch (err) {
    console.error("Error fetching attendance summary:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.saveAttendanceSummary = async (req, res) => {
  try {
    const { classId, armId, sessionId, termId, timesOpened, records } = req.body;

    let attendance = await Attendance.findOne({
      classId,
      armId,
      sessionId,
      termId,
    });

    if (attendance) {
      // Update existing summary
      attendance.timesOpened = timesOpened;
      attendance.records = records;
      await attendance.save();
    } else {
      // Create new
      attendance = new Attendance({
        classId,
        armId,
        sessionId,
        termId,
        timesOpened,
        records,
      });
      await attendance.save();
    }

    res.json({ message: "Attendance summary saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving attendance" });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId, sessionId, termId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    // Build filter
    const filter = {
      "records.studentId": studentId,
    };
    if (sessionId) filter.sessionId = sessionId;
    if (termId) filter.termId = termId;

    // Fetch attendance records that include this student
    const attendanceDocs = await Attendance.find(filter)
      .populate("classId", "name")
      .populate("armId", "name")
      .populate("sessionId", "name")
      .populate("termId", "name");

    if (!attendanceDocs.length) {
      return res.json({ message: "No attendance records found for this student." });
    }

    // Map data neatly
    const records = attendanceDocs.map((att) => {
      const studentRecord = att.records.find(
        (r) => r.studentId.toString() === studentId
      );

      const timesPresent = studentRecord ? studentRecord.timesPresent : 0;
      const totalTimes = att.timesOpened || 0;
      const percentage =
        totalTimes > 0 ? ((timesPresent / totalTimes) * 100).toFixed(1) : "0";

      return {
        class: att.classId?.name,
        arm: att.armId?.name,
        session: att.sessionId?.name,
        term: att.termId?.name,
        timesOpened: totalTimes,
        timesPresent,
        percentage: `${percentage}%`,
      };
    });

    res.json({
      totalRecords: records.length,
      records,
    });
  } catch (err) {
    console.error("Error fetching student attendance:", err);
    res.status(500).json({ error: "Server error" });
  }
};