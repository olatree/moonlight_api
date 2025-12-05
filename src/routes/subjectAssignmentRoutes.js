const express = require("express");
const router = express.Router();
const { protect, restrictToRoles } = require("../middleware/authMiddleware");
const subjectAssignmentController = require("../controllers/subjectAssignmentController");


router.use(protect);
router.use(restrictToRoles("admin", "super_admin", "principal", "master_admin"));

// Assign subject
router.post("/", subjectAssignmentController.assignSubject);

// Get subjects for class+arm
router.get("/:classId/:armId", subjectAssignmentController.getSubjectsForArm);

// Remove subject
router.delete("/:assignmentId", subjectAssignmentController.removeSubject);

module.exports = router;
