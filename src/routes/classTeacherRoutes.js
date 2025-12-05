const express = require("express");
const router = express.Router();
const controller = require("../controllers/classTeacherController");

// POST - assign
router.post("/", controller.assignClassTeacher);

// GET - all
router.get("/", controller.getAllClassTeachers);

// GET - single (class + arm)
router.get("/:classId/:armId", controller.getClassTeacher);

router.delete("/:id", controller.deleteClassTeacher);

module.exports = router;
