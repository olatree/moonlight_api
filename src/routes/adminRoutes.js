// server/routes/adminRoutes.js
const express = require("express");
const { protect, restrictToRoles } = require("../middleware/authMiddleware");
const {
  createAdmin,
  getAdmins,
  updateAdmin,
  deleteAdmin,
} = require("../controllers/adminController");

const router = express.Router();

// only super_admin can manage admins
router.use(protect, restrictToRoles("super_admin", "master_admin"));

// create a new admin
router.post("/", createAdmin);

// view all admins
router.get("/", getAdmins);

// update an admin (role, name, email, block/unblock)
router.put("/:id", updateAdmin);

// delete an admin
router.delete("/:id", deleteAdmin);

module.exports = router;
