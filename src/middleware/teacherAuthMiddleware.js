const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");

exports.protectTeacher = async (req, res, next) => {
  try {
    const token = req.cookies.teacherToken;
    if (!token) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.teacher = await Teacher.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
