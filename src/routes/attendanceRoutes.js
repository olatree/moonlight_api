const express = require("express");
const router = express.Router();
const {
  getAttendanceSummary,
  saveAttendanceSummary,
  getStudentAttendance,
} = require("../controllers/attendanceController");

router.get("/summary", getAttendanceSummary);
router.post("/summary", saveAttendanceSummary);
router.get("/student", getStudentAttendance);

module.exports = router;
