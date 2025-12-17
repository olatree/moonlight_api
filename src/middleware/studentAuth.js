// const jwt = require("jsonwebtoken");
// const Student = require("../models/Student");

// exports.verifyStudent = async (req, res, next) => {
//   try {
//     const token = req.cookies.studentToken; // read from cookie
//     if (!token) {
//       console.log("No token found");
//       return res.status(401).json({ message: "Not authenticated" });
//     } 

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const student = await Student.findById(decoded.id).select("-password");

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     req.student = student; // attach to request
//     next();
//   } catch (err) {
//     console.error("Student auth error:", err.message);
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// };


const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

exports.verifyStudent = async (req, res, next) => {
  try {
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.cookies.studentToken) {
      // Fallback to cookie if header not present
      token = req.cookies.studentToken;
    }

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
    req.user = { id: student._id, role: 'student' }; // Also add req.user for consistency with AuthContext
    next();
  } catch (err) {
    console.error("Student auth error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};