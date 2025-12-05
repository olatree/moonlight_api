const express = require("express");
const router = express.Router();
const {
  saveClassTeacherComments,
  savePrincipalComments,
  getTermReports,
  getStudentReport,
} = require("../controllers/termReportController");

// Comment routes
router.post("/class-teacher", saveClassTeacherComments);
router.post("/principal", savePrincipalComments);

// Fetch routes
router.get("/", getTermReports);
router.get("/:enrollmentId", getStudentReport);

module.exports = router;
