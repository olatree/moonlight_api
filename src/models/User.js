// // server/models/User.js
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const roles = [
//   "student",
//   "teacher",
//   "class_teacher",
//   "principal",
//   "admin",
//   "super_admin",
// ];

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true, minlength: 6 },
//     role: { type: String, enum: roles, default: "student" },

//     // Unique 6-digit ID for login
//     userId: { type: String, unique: true },

//     // if student, link to class & records later
//     class: { type: String },

//     isBlocked: { type: Boolean, default: false }, // super admin can block
//   },
//   { timestamps: true }
// );

// // Generate unique 6-digit userId before save
// userSchema.pre("save", async function (next) {
//   if (!this.isNew) return next();

//   // keep trying until unique
//   let unique = false;
//   while (!unique) {
//     const id = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
//     const existing = await this.constructor.findOne({ userId: id });
//     if (!existing) {
//       this.userId = id;
//       unique = true;
//     }
//   }

//   next();
// });

// // Hash password before save
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Method to check password
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("User", userSchema);


// server/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const roles = [
  "student",
  "teacher",
  "class_teacher",
  "principal",
  "admin",
  "super_admin",
  "master_admin"
];

const userSchema = new mongoose.Schema(
  {
    // Common fields for all users
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 3 },
    role: { type: String, enum: roles, default: "student" },
    picture: { type: String }, // Stores path or URL of the teacher's picture
    signature: { type: String }, // Stores path or URL of the teacher's signature

    // Unique 6-digit ID for login
    userId: { type: String, unique: true },

    // Student-specific
    class: { type: String }, // e.g., JSS1A

    // Teacher-specific
    phone: { type: String },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }], // multiple subjects
    classes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }], // multiple classes
    isClassTeacher: { type: Boolean, default: false },
    classTeacherOf: { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
    hireDate: { type: Date }, // only set for teachers

    // Admin/super admin controls
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Generate unique 6-digit userId before save
userSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  let unique = false;
  while (!unique) {
    const id = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await this.constructor.findOne({ userId: id });
    if (!existing) {
      this.userId = id;
      unique = true;
    }
  }

  // If teacher, set hireDate if not already set
  if (["teacher", "class_teacher"].includes(this.role) && !this.hireDate) {
    this.hireDate = new Date();
  }

  next();
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
