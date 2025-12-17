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

// exports.verifyStudent = async (req, res, next) => {
//   try {
//     // Check Authorization header first
//     const authHeader = req.headers.authorization;
//     let token = null;

//     if (authHeader && authHeader.startsWith('Bearer ')) {
//       token = authHeader.substring(7); // Remove 'Bearer ' prefix
//     } else if (req.cookies.studentToken) {
//       // Fallback to cookie if header not present
//       token = req.cookies.studentToken;
//     }

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
//     req.user = { id: student._id, role: 'student' }; // Also add req.user for consistency with AuthContext
//     next();
//   } catch (err) {
//     console.error("Student auth error:", err.message);
//     res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

exports.verifyStudent = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check user type and fetch appropriate user
      if (decoded.role === 'student') {
        req.user = await Student.findById(decoded.id).select('-password');
        req.user.role = 'student';
      } else {
        req.user = await User.findById(decoded.id).select('-password');
        req.user.role = decoded.role || 'user';
      }
      
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};