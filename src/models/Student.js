const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    admissionNumber: { type: String, unique: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female"] },
    parentContact: { type: String },
    image: { type: String, default: null }, // Cloudinary URL
    blocked: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    password: { type: String}, // Added password field
  },
  { timestamps: true }
);

// ====== SANITIZE NAME & AUTO-GENERATE PASSWORD ======
studentSchema.pre("save", async function (next) {
  // Format name: capitalize each word
  if (this.name) {
    this.name = this.name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  // If password not set, use first name (first word)
  if (!this.password && this.name) {
    const parts = this.name.trim().split(" ");
    const firstName = parts[0].toLowerCase();
    this.password = firstName;
  }

  // Hash password if modified or new
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Auto-generate 6-digit admission number if not provided
studentSchema.pre("save", async function (next) {
  if (!this.admissionNumber) {
    let unique = false;
    let admission;
    while (!unique) {
      admission = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await mongoose.model("Student").findOne({ admissionNumber: admission });
      if (!exists) unique = true;
    }
    this.admissionNumber = admission;
  }
  next();
});

module.exports = mongoose.model("Student", studentSchema);
