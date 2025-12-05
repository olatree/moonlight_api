const express = require("express");
const router = express.Router();
const { protect, restrictToRoles } = require("../middleware/authMiddleware");
const {
  createClass,
  getClasses,
  updateClass,
  deleteClass,
  addArm,
  updateArm,
  deleteArm,
} = require("../controllers/classController");

router.use(protect);
router.use(restrictToRoles("admin", "super_admin", "principal", "teacher", "master_admin"));

// Class routes
router.post("/", createClass);
router.get("/", getClasses);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

// Arm routes
router.post("/:classId/arms", addArm);
router.put("/arms/:id", updateArm);
router.delete("/arms/:id", deleteArm);

module.exports = router;
