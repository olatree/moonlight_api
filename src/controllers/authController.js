// server/controllers/authController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate and set JWT cookie
// const generateToken = (res, userId, role) => {
//   const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//   });

//   res.cookie("jwt", token, {
//     httpOnly: true,
//     // secure: process.env.NODE_ENV === "production", // true on production (HTTPS)
//     secure: true, // true on production (HTTPS)
//     sameSite: "None",
//     path: "/",
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//   });

// return token;
// };
  const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};


// @desc Login user
// exports.login = async (req, res) => {
//   const { userId, password } = req.body;

//   try {
//     const user = await User.findOne({ userId });
//     // if (!user) return res.status(400).json({ message: "Invalid ID or password" });
//     if (!user) {
//   res.clearCookie("jwt", {
//     httpOnly: true,
//     secure: true,
//     sameSite: "none",
//     path: "/",
//   });
//   return res.status(400).json({ message: "Invalid ID or password" });
// }

//     const isMatch = await user.matchPassword(password);
//     // if (!isMatch) return res.status(400).json({ message: "Invalid ID or password" });
//     if (!isMatch) {
//   res.clearCookie("jwt", {
//     httpOnly: true,
//     secure: true,
//     sameSite: "none",
//     path: "/",
//   });
//   return res.status(400).json({ message: "Invalid ID or password" });
// }

//     generateToken(res, user._id, user.role);

//     res.status(200).json({
//       id: user._id,
//       userId: user.userId,
//       name: user.name,
//       role: user.role,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// controllers/studentController.js
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

exports.loginStudent = async (req, res) => {
  try {
    const { admissionNumber, password } = req.body;

    // 1. Find student (check if not archived)
    const student = await Student.findOne({ admissionNumber, archived: false });
    if (!student) {
      return res.status(404).json({ message: "Student record not found." });
    }

    // 2. Check if blocked
    if (student.blocked) {
      return res.status(403).json({ message: "Account blocked. Contact admin." });
    }

    // 3. Compare password (using bcrypt)
    // Note: Since your schema hashes the first name, ensure 'password' matches that.
    const isMatch = await student.comparePassword(password); 
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admission number or password." });
    }

    // 4. Generate Token (We add the role here!)
    const token = jwt.sign(
      { id: student._id, role: "student" }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Send Response
    res.status(200).json({
      message: "Login successful",
      token,
      student: {
        id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error during login." });
  }
};


// @desc Register new user
exports.register = async (req, res) => {
  try {
    const { name, userId, password, role } = req.body;

    // Ensure uniqueness by userId
    const exists = await User.findOne({ userId });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, userId, password, role });
    generateToken(res, user._id, user.role);

    res.status(201).json({
      id: user._id,
      name: user.name,
      userId: user.userId,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Logout user
exports.logout = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ message: "Logged out successfully" });
};

// @desc Current logged in user
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    // Always return ALL users
    const users = await User.find().select("-password");

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
};

