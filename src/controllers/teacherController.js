// const Teacher = require("../models/Teacher");

// // Create teacher
// exports.createTeacher = async (req, res) => {
//   try {
//     const teacher = await Teacher.create(req.body);
//     res.status(201).json(teacher);
//     console.log("Created teacher:", teacher);
//   } catch (error) {
//     res.status(500).json({ message: "Error creating teacher", error });
//   }
// };

// // Get all teachers
// exports.getTeachers = async (req, res) => {
//   try {
//     const teachers = await Teacher.find()
//       .populate("subjects", "name")   // show subject names
//       .populate("classes", "name")    // show class names
//       .populate("classTeacherOf", "name"); 

//     res.json(teachers);
//   } catch (err) {
//     console.error("Get Teachers error:", err);
//     res.status(500).json({ message: "Error fetching teachers", err });
//   }
// };

// // Get teacher by ID
// exports.getTeacherById = async (req, res) => {
//   try {
//     const teacher = await Teacher.findById(req.params.id)
//       .populate("subjects", "name")
//       .populate("classes", "name")
//       .populate("classTeacherOf", "name");

//     if (!teacher) return res.status(404).json({ message: "Teacher not found" });
//     res.json(teacher);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching teacher", error });
//   }
// };

// // Update teacher
// exports.updateTeacher = async (req, res) => {
//   try {
//     const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     if (!teacher) return res.status(404).json({ message: "Teacher not found" });
//     res.json(teacher);
//   } catch (error) {
//     res.status(500).json({ message: "Error updating teacher", error });
//   }
// };

// // Delete teacher
// exports.deleteTeacher = async (req, res) => {
//   try {
//     const teacher = await Teacher.findByIdAndDelete(req.params.id);
//     if (!teacher) return res.status(404).json({ message: "Teacher not found" });
//     res.json({ message: "Teacher deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting teacher", error });
//   }
// };

// server/controllers/teacherController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// Helper: Upload image to Cloudinary and return secure URL
const uploadToCloudinary = async (fileBuffer, folder = "teachers") => {
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

// CREATE TEACHER
exports.createTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, isClassTeacher } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Handle file uploads
    let pictureUrl = null;
    let signatureUrl = null;

    if (req.files) {
      if (req.files.picture) {
        const pictureResult = await uploadToCloudinary(req.files.picture[0].buffer, "pictures");
        pictureUrl = pictureResult.url;
      }
      if (req.files.signature) {
        const sigResult = await uploadToCloudinary(req.files.signature[0].buffer, "signatures");
        signatureUrl = sigResult.url;
      }
    }

    // Create teacher
    const teacher = await User.create({
      name,
      email,
      password,
      phone: phone || "",
      role: "teacher", // or allow "class_teacher" if needed
      picture: pictureUrl,
      signature: signatureUrl,
      isClassTeacher: isClassTeacher === "true" || isClassTeacher === true,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        userId: teacher.userId,
        phone: teacher.phone,
        picture: teacher.picture,
        signature: teacher.signature,
        isClassTeacher: teacher.isClassTeacher,
        isActive: teacher.isActive,
      },
    });
  } catch (error) {
    console.error("Create Teacher error:", error);
    res.status(500).json({ message: "Error creating teacher", error: error.message });
  }
};

// UPDATE TEACHER (for Edit form)
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, isClassTeacher, isActive } = req.body;

    const updates = {
      name,
      email,
      phone: phone || "",
      isClassTeacher: isClassTeacher === "true" || isClassTeacher === true,
      isActive: isActive === "true" || isActive === true,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updates.password = password;
    }

    // Handle new image uploads (optional — old ones stay if not replaced)
    if (req.files) {
      if (req.files.picture) {
        const result = await uploadToCloudinary(req.files.picture[0].buffer, "pictures");
        updates.picture = result.url;
      }
      if (req.files.signature) {
        const result = await uploadToCloudinary(req.files.signature[0].buffer, "signatures");
        updates.signature = result.url;
      }
    }

    const teacher = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("Update Teacher error:", error);
    res.status(500).json({ message: "Error updating teacher", error: error.message });
  }
};

// ✅ Create teacher
// exports.createTeacher = async (req, res) => {
//   try {
//     // Force role to "teacher" if not explicitly set
//     const teacherData = { ...req.body, role: req.body.role || "teacher" };

//     const teacher = await User.create(teacherData);
//     res.status(201).json(teacher);
//     console.log("Created teacher:", teacher);
//   } catch (error) {
//     console.error("Create Teacher error:", error);
//     res.status(500).json({ message: "Error creating teacher", error });
//   }
// };


// ✅ Get all teachers
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: { $in: ["teacher", "class_teacher"] } })
      .populate("subjects", "name")
      .populate("classes", "name")
      .populate("classTeacherOf", "name");

    res.json(teachers);
  } catch (err) {
    console.error("Get Teachers error:", err);
    res.status(500).json({ message: "Error fetching teachers", err });
  }
};

// ✅ Get teacher by ID
exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: { $in: ["teacher", "class_teacher"] } })
      .populate("subjects", "name")
      .populate("classes", "name")
      .populate("classTeacherOf", "name");

    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  } catch (error) {
    console.error("Get Teacher by ID error:", error);
    res.status(500).json({ message: "Error fetching teacher", error });
  }
};

// 

// ✅ Update teacher
// exports.updateTeacher = async (req, res) => {
//   try {
//     const updates = { ...req.body };

//     // ✅ Prevent overwriting password with empty string
//     if (updates.password) {
//       updates.password = await bcrypt.hash(updates.password, 10);
//     } else {
//       delete updates.password;
//     }

//     const teacher = await User.findOneAndUpdate(
//       { _id: req.params.id, role: { $in: ["teacher", "class_teacher"] } },
//       updates,
//       { new: true }
//     );

//     if (!teacher) {
//       return res.status(404).json({ message: "Teacher not found" });
//     }

//     res.json(teacher);
//   } catch (error) {
//     console.error("Update Teacher error:", error);
//     res.status(500).json({ message: "Error updating teacher", error });
//   }
// };

// ✅ Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: { $in: ["teacher", "class_teacher"] } });

    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Delete Teacher error:", error);
    res.status(500).json({ message: "Error deleting teacher", error });
  }
};
