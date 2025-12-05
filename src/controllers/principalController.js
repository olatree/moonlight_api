// server/controllers/adminController.js
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Upload image to Cloudinary and return secure URL
const uploadToCloudinary = async (fileBuffer, folder = "principals") => {
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

// Create Principal
// const createPrincipal = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;
//     console.log("Creating principal with data:", req.body);

//     // if (!["principal"].includes(role)) {
//     //   return res.status(400).json({ message: "Invalid Principal role" });
//     // }

//     const exists = await User.findOne({ email });
//     if (exists) return res.status(400).json({ message: "Email already exists" });

//     const principal = await User.create({
//       name,
//       email,
//       password,
//       role: "principal",
//     });

//     res.status(201).json({ message: "Principal Created", principal });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// CREATE PRINCIPAL
const createPrincipal = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    // Create principal
    const principal = await User.create({
      name,
      email,
      password,
      // phone: phone || "",
      role: "principal", // or allow "class_teacher" if needed
      picture: pictureUrl,
      signature: signatureUrl,
      // isClassTeacher: isClassTeacher === "true" || isClassTeacher === true,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      principal: {
        _id: principal._id,
        name: principal.name,
        email: principal.email,
        userId: principal.userId,
        phone: principal.phone,
        picture: principal.picture,
        signature: principal.signature,
        isActive: principal.isActive,
      },
    });
  } catch (error) {
    console.error("Create Principal error:", error);
    res.status(500).json({ message: "Error creating principal", error: error.message });
  }
};

// UPDATE PRINCIPAL (for Edit form)
const updatePrincipal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, isActive } = req.body;

    const updates = {
      name,
      email,
      phone: phone || "",
      // isClassTeacher: isClassTeacher === "true" || isClassTeacher === true,
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

    const principal = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!principal) {
      return res.status(404).json({ message: "Principal not found" });
    }

    res.json({
      success: true,
      principal,
    });
  } catch (error) {
    console.error("Update Principal error:", error);
    res.status(500).json({ message: "Error updating principal", error: error.message });
  }
};

// Get all Principals
const getPrincipals = async (req, res) => {
  try {
    const principals = await User.find({ role: { $in: ["principal"] } }).select(
      "-password"
    );
    res.json(principals);
  } catch (err) {
    console.error("Error fetching principals:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update Principal
// const updatePrincipal = async (req, res) => {
//   try {
//     const { name, email, password, isBlocked } = req.body;

//     const principal = await User.findById(req.params.id);
//     if (!principal) return res.status(404).json({ message: "Principal not found" });

//     principal.name = name || principal.name;
//     principal.email = email || principal.email;
//     principal.password = password || principal.password;
//     if (typeof isBlocked !== "undefined") {
//       principal.isBlocked = isBlocked;
//     }

//     await principal.save();
//     res.json({ message: "Principal updated", principal });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// Delete Principal
const deletePrincipal = async (req, res) => {
  try {
    const principal = await User.findById(req.params.id);
    if (!principal) return res.status(404).json({ message: "Principal not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Principal deleted" });
  } catch (err) {
    console.error("Error deleting Principal:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createPrincipal, getPrincipals, updatePrincipal, deletePrincipal};