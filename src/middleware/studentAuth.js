const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

exports.verifyStudent = async (req, res, next) => {
  try {
    const token = req.cookies.studentToken; // read from cookie
    if (!token) {
      console.log("No token found");
      return res.status(401).json({ message: "Not authenticated" });
    } 

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    req.student = student; // attach to request
    next();
  } catch (err) {
    console.error("Student auth error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
