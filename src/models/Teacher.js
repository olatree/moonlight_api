const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");  // or require("bcrypt");

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Unique 6-digit ID for login
  teacherId: { type: String, unique: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }], // multiple subjects
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }], // multiple classes
  isClassTeacher: { type: Boolean, default: false },
  classTeacherOf: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null }, // one class only
  hireDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

teacherSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  // keep trying until unique
  let unique = false;
  while (!unique) {
    const id = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const existing = await this.constructor.findOne({ teacherId: id });
    if (!existing) {
      this.teacherId = id;
      unique = true;
    }
  }

  next();
});

// Hash password before save
teacherSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check password
teacherSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Teacher", teacherSchema);
