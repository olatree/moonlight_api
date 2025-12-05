// routes/teacherAssignmentRoutes.js
const express = require("express");
const router = express.Router();
const teacherAssignmentController = require("../controllers/teacherAssignmentController");

// POST - assign multiple subjects
router.post("/", teacherAssignmentController.assignSubjects);

// GET - fetch assignments for teacher in a class+arm
router.get("/:teacherId/:classId/:armId", teacherAssignmentController.getAssignments);

// DELETE - remove an assignment
router.delete("/:id", teacherAssignmentController.deleteAssignment);

// Teacher’s subject/class/arm hierarchy
router.get("/:teacherId/subjects", teacherAssignmentController.getTeacherSubjects);
router.get("/:teacherId/:subjectId/classes", teacherAssignmentController.getTeacherClasses);
router.get("/:teacherId/:subjectId/:classId/arms", teacherAssignmentController.getTeacherArms);


module.exports = router;
