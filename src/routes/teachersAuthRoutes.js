const express = require("express");
const router = express.Router();
const { teacherLogin, teacherMe } = require("../controllers/teacherAuthController");
const { protectTeacher } = require("../middleware/teacherAuthMiddleware");

router.post("/login", teacherLogin);
router.get("/me", protectTeacher, teacherMe);

module.exports = router;
