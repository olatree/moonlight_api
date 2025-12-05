// server/controllers/adminController.js
const User = require("../models/User");

// Create Admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!["admin", "super_admin", "master_admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid admin role" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const admin = await User.create({
      name,
      email,
      password,
      role,
    });

    res.status(201).json({ message: "Admin created", admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all Admins
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ["admin", "super_admin"] } }).select(
      "-password"
    );
    res.json(admins);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update Admin
const updateAdmin = async (req, res) => {
  try {
    const { name, email, password, role, isBlocked } = req.body;

    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.name = name || admin.name;
    admin.email = email || admin.email;
    admin.password = password || admin.password;
    if (role && ["admin", "super_admin"].includes(role)) {
      admin.role = role;
    }
    if (typeof isBlocked !== "undefined") {
      admin.isBlocked = isBlocked;
    }

    await admin.save();
    res.json({ message: "Admin updated", admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted" });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createAdmin, getAdmins, updateAdmin, deleteAdmin };
