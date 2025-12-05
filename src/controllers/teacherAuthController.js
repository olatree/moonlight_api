const Teacher = require("../models/Teacher");
const jwt = require("jsonwebtoken");

// Generate and set JWT cookie
const generateToken = (res, userId, role) => {
  const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true on production (HTTPS)
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// @desc Login teacher
exports.teacherLogin = async (req, res) => {
  const { teacherId, password } = req.body;

  try {
    const teacher = await Teacher.findOne({ teacherId });
    if (!teacher) {
      return res.status(400).json({ message: "Invalid ID or password" });
    }

    const isMatch = await teacher.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid ID or password" });
    }

    generateToken(res, teacher._id, "teacher");

    res.json({
      id: teacher._id,
      teacherId: teacher.teacherId,
      name: teacher.name,
      role: "teacher",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teachers/me
exports.teacherMe = async (req, res) => {
  res.json(req.teacher);
};
