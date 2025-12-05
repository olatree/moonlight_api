// const Student = require("../models/Student");
// const Enrollment = require("../models/Enrollment");

// // @desc Register a new student and enroll them in current session/term
// exports.registerStudent = async (req, res) => {
//   try {
//     const { name, admissionNumber, dateOfBirth, gender, parentContact, classId, armId, sessionId, termId } = req.body;

//     // Create student
//     const student = await Student.create({ name, admissionNumber, dateOfBirth, gender, parentContact });

//     // Create enrollment for current session/term
//     const enrollment = await Enrollment.create({
//       studentId: student._id,
//       classId,
//       armId,
//       sessionId,
//       termId,
//     });

//     res.status(201).json({ student, enrollment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // @desc Get all students with their current enrollment
// exports.getStudents = async (req, res) => {
//   try {
//     const enrollments = await Enrollment.find()
//       .populate("studentId")
//       .populate("classId")
//       .populate("armId")
//       .populate("sessionId")
//       .populate("termId");

//     res.json(enrollments);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // @desc Block a student for current enrollment
// exports.blockStudent = async (req, res) => {
//   try {
//     const { id } = req.params; // enrollmentId
//     const enrollment = await Enrollment.findByIdAndUpdate(id, { isBlocked: true }, { new: true });
//     if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

//     res.json({ message: "Student blocked", enrollment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // @desc Unblock a student
// exports.unblockStudent = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const enrollment = await Enrollment.findByIdAndUpdate(id, { isBlocked: false }, { new: true });
//     if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

//     res.json({ message: "Student unblocked", enrollment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // @desc Promote a student to new class in new session
// exports.promoteStudent = async (req, res) => {
//   try {
//     const { enrollmentId, newClassId, newArmId, newSessionId, newTermId } = req.body;

//     const enrollment = await Enrollment.findById(enrollmentId);
//     if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

//     const newEnrollment = await Enrollment.create({
//       studentId: enrollment.studentId,
//       classId: newClassId,
//       armId: newArmId,
//       sessionId: newSessionId,
//       termId: newTermId,
//     });

//     res.json({ message: "Student promoted", newEnrollment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // @desc Make a student repeat current class in new session
// exports.repeatStudent = async (req, res) => {
//   try {
//     const { enrollmentId, newSessionId, newTermId } = req.body;

//     const enrollment = await Enrollment.findById(enrollmentId);
//     if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

//     const newEnrollment = await Enrollment.create({
//       studentId: enrollment.studentId,
//       classId: enrollment.classId,
//       armId: enrollment.armId,
//       sessionId: newSessionId,
//       termId: newTermId,
//       isRepeating: true,
//     });

//     res.json({ message: "Student set to repeat class", newEnrollment });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


const Student = require("../models/Student");
const Enrollment = require("../models/Enrollment");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const jwt = require("jsonwebtoken");

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Upload image to Cloudinary and return secure URL
const uploadToCloudinary = async (fileBuffer, folder = "students") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: `school-app/${folder}`, resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      )
      .end(fileBuffer);
  });
};

// -------------------------
// Register Student
// -------------------------
exports.registerStudent = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, parentContact, classId, armId, sessionId, termId } = req.body;

    // ── Validation ─────────────────────────────────────
    if (!name || !dateOfBirth || !gender || !parentContact || !classId || !armId || !sessionId) {
      return res.status(400).json({
        message: "All required fields are mandatory: name, dateOfBirth, gender, parentContact, classId, armId, sessionId",
      });
    }
    let imageUrl = null;

    // ── Handle Image Upload (from req.file when using upload.single('picture')) ──
    // Your frontend sends the file as "picture`
    if (req.file) {
      // Using upload.single('picture') → file is in req.file
      const result = await uploadToCloudinary(req.file.buffer, "students/pictures");
      imageUrl = result.url; // secure_url
    }
    // ── OR if you ever switch back to upload.fields() → req.files.picture[0]
    else if (req.files?.picture?.[0]) {
      const result = await uploadToCloudinary(req.files.picture[0].buffer, "students/pictures");
      imageUrl = result.url;
    }

     // Extract first name before saving (for plain-text password)
    const firstName = name?.trim().split(" ")[0]?.toLowerCase();

    // Create student (admissionNumber auto-generated)
    const student =  new Student({ 
      name: name.trim(),
      dateOfBirth: new Date(dateOfBirth),
      gender,
      parentContact: parentContact.trim(),
      image: imageUrl, // null if no photo
    });
    await student.save(); // <---- important: triggers pre('save') hooks

    // Create enrollment
    const enrollment = await Enrollment.create({
      studentId: student._id,
      classId,
      armId,
      sessionId,
      // termId,
    });

    res.status(201).json({message: "Student registered and enrolled successfully.", student, enrollment, loginCredentials: {
        admissionNumber: student.admissionNumber,
        password: firstName,
      }, });
      console.log("Student registered:", student);
      
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log("registerStudent error:", err);
    
  }
};

// Get students (enrollments) with optional filtering by sessionId, classId, armId
exports.getStudents = async (req, res) => {
  try {
    const { sessionId, classId, armId, studentId } = req.query;

    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (classId) filter.classId = classId;
    if (armId) filter.armId = armId;
    if (studentId) filter.studentId = studentId;
    // if (req.query.studentId) filter.studentId = req.query.studentId;

    const enrollments = await Enrollment.find(filter)
      .populate("studentId", "name image admissionNumber dateOfBirth gender parentContact blocked")
      .populate("classId", "name")
      .populate("armId", "name")
      .populate("sessionId", "name")
      .lean();

    res.json(enrollments);
  } catch (err) {
    console.error("getStudents error:", err);
    res.status(500).json({ message: err.message });
  }
};

// New endpoint to count students in a class
exports.getCount = async (req, res) => {
  try {
    const { classId, armId, sessionId, termId } = req.query;

    if (!classId || !armId || !sessionId || !termId) {
      return res.status(400).json({ success: false, message: 'Missing required parameters: classId, armId, sessionId, and termId are required' });
    }

    const count = await Enrollment.countDocuments({
      classId,
      armId,
      sessionId,
      termId,
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error('Error counting students:', error);
    res.status(500).json({ success: false, message: 'Server error while counting students' });
  }
};

// -------------------------
// Block Student
// -------------------------
exports.blockStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByIdAndUpdate(
      studentId,
      { blocked: true },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student blocked successfully", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------
// Unblock Student
// -------------------------
exports.unblockStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByIdAndUpdate(
      studentId,
      { blocked: false },
      { new: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student unblocked successfully", student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------
// Update Student (with old image deletion)
// -------------------------
// exports.updateStudent = async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     const { name, dateOfBirth, gender, parentContact, classId, armId, sessionId, termId } = req.body;

//     // Find the student first
//     const student = await Student.findById(studentId);
//     if (!student) return res.status(404).json({ message: "Student not found" });

//     let imageUrl = student.image; // default to existing image

//     // If new image uploaded
//     if (req.file) {
//       // Delete old image from Cloudinary
//       if (student.image) {
//         // Extract public_id from the Cloudinary URL
//         const parts = student.image.split("/");
//         const filenameWithExt = parts[parts.length - 1]; // e.g., "abc123.jpg"
//         const public_id = `students/${filenameWithExt.split(".")[0]}`;

//         try {
//           await cloudinary.uploader.destroy(public_id);
//         } catch (err) {
//           console.error("Failed to delete old image from Cloudinary:", err);
//         }
//       }

//       // Upload new image
//       const upload = await cloudinary.uploader.upload(req.file.path, { folder: "students" });
//       imageUrl = upload.secure_url;
//     }

//     // Update student info
//     student.name = name;
//     student.dateOfBirth = dateOfBirth;
//     student.gender = gender;
//     student.parentContact = parentContact;
//     student.image = imageUrl;
//     await student.save();

//     // Update enrollment if any enrollment fields provided
//     if (classId || armId || sessionId) {
//       await Enrollment.findOneAndUpdate(
//         { studentId },
//         { ...(classId && { classId }), ...(armId && { armId }), ...(sessionId && { sessionId }) }
//       );
//     }

//     res.json({ message: "Student updated successfully", student });
//   } catch (err) {
//     console.error("updateStudent error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

exports.updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let imageUrl = student.image;
    let oldPublicId = null;

    // ── Handle Image Update (from buffer, no disk) ─────────────────────
    if (req.file) {
      // Extract old public_id for deletion (if exists)
      if (student.image) {
        // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/students/pictures/abc123.jpg
        const urlParts = student.image.split("/");
        const filename = urlParts[urlParts.length - 1]; // abc123.jpg
        const publicIdWithExt = filename.split(".")[0]; // abc123
        oldPublicId = `students/pictures/${publicIdWithExt}`;
      }

      // Upload new image from buffer
      const result = await uploadToCloudinary(req.file.buffer, "students/pictures");
      imageUrl = result.url; // secure_url

      // Delete old image from Cloudinary (fire and forget)
      if (oldPublicId) {
        cloudinary.uploader.destroy(oldPublicId, { invalidate: true })
          .catch(err => console.warn("Failed to delete old image:", oldPublicId, err.message));
      }
    }

    // ── Prepare Student Updates (only changed fields) ──────────────────
    const allowedStudentFields = ["name", "dateOfBirth", "gender", "parentContact"];
    const studentUpdates = {};

    allowedStudentFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== "" && req.body[field] !== null) {
        studentUpdates[field] = field === "name" || field === "parentContact"
          ? req.body[field].trim()
          : req.body[field];
      }
    });

    // Always include image if updated
    if (req.file) {
      studentUpdates.image = imageUrl;
    }

    // Apply updates to student
    Object.assign(student, studentUpdates);
    await student.save();

    // ── Handle Enrollment Updates (only if relevant fields sent) ───────
    const enrollmentUpdates = {};
    if (req.body.classId) enrollmentUpdates.classId = req.body.classId;
    if (req.body.armId) enrollmentUpdates.armId = req.body.armId;
    if (req.body.sessionId) enrollmentUpdates.sessionId = req.body.sessionId;

    if (Object.keys(enrollmentUpdates).length > 0) {
      await Enrollment.findOneAndUpdate(
        { studentId: student._id },
        enrollmentUpdates,
        { new: true, runValidators: true }
      );
    }

    // Return fresh student data
    const updatedStudent = await Student.findById(studentId);

    return res.json({
      message: "Student updated successfully",
      student: updatedStudent,
    });

  } catch (err) {
    console.error("updateStudent error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid student ID" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(err.errors)[0].message });
    }

    return res.status(500).json({
      message: "Failed to update student",
    });
  }
};


// -------------------------
// Delete Student
// -------------------------
exports.deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Delete student
    const student = await Student.findByIdAndDelete(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Optionally delete enrollments
    await Enrollment.deleteMany({ studentId });

    res.json({ message: "Student and enrollments deleted successfully" });
  } catch (err) {
    console.error("deleteStudent error:", err);
    res.status(500).json({ message: err.message });
  }
};

// -------------------------
// Login Student
// -------------------------
exports.loginStudent = async (req, res) => {
  try {
    const { admissionNumber, password } = req.body;

    // 1️⃣ Validate input
    if (!admissionNumber || !password) {
      return res.status(400).json({ message: "Admission number and password are required." });
    }

    // 2️⃣ Find student by admission number
    const student = await Student.findOne({ admissionNumber, archived: false });
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // 3️⃣ Check if student is blocked
    if (student.blocked) {
      return res.status(403).json({ message: "Your account is blocked. Please contact the school." });
    }

    // 4️⃣ Compare password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admission number or password." });
    }

    // 5️⃣ Generate JWT token (valid for 7 days)
    const studentToken = jwt.sign(
      { id: student._id, admissionNumber: student.admissionNumber },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Set secure cookie
    res.cookie("studentToken", studentToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 6️⃣ Send response (hide hashed password)
    res.status(200).json({
      message: "Login successful.",
      studentToken,
      student: {
        id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber,
        image: student.image,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        parentContact: student.parentContact,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// -------------------------
// Get Current Logged-in Student
// -------------------------
exports.getMe = async (req, res) => {
  try {
    // req.student is set by verifyStudent middleware
    res.json(req.student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// -------------------------
// Logout Student (clear cookie)
// -------------------------
exports.logoutStudent = async (req, res) => {
  try {
    res.clearCookie("studentToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout failed" });
  }
};
