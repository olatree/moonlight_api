// const express = require("express");
// const router = express.Router();
// const { protect, restrictToRoles } = require("../middleware/authMiddleware");
// const {
//     createTeacher,
//     getTeachers,
//     getTeacherById,
//     updateTeacher,
//     deleteTeacher
// } = require("../controllers/teacherController");

// router.use(protect);
// router.use(restrictToRoles("admin", "super_admin"));

// // CRUD
// router.post("/", createTeacher);
// router.get("/", getTeachers);
// router.get("/:id", getTeacherById);
// router.put("/:id", updateTeacher);
// router.delete("/:id", deleteTeacher);

// module.exports = router;


// server/routes/teacherRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

const { protect, restrictToRoles } = require("../middleware/authMiddleware");
const {
  createTeacher,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");

// ✅ All teacher routes are protected & restricted
router.use(protect);
router.use(restrictToRoles("admin", "super_admin", "principal", "master_admin"));

// Important: Use memoryStorage so file is available as buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

router.post(
  "/",
  upload.fields([
    { name: "picture", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  createTeacher
);

router.put(
  "/:id",
  upload.fields([
    { name: "picture", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  updateTeacher
);

// ✅ CRUD routes
// router.post("/", createTeacher);        // Create teacher
router.get("/", getTeachers);           // Get all teachers
router.get("/:id", getTeacherById);     // Get teacher by ID
// router.put("/:id", updateTeacher);      // Update teacher
router.delete("/:id", deleteTeacher);   // Delete teacher

module.exports = router;
