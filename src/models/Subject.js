// server/src/models/Subject.js
const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // e.g., "Mathematics", "English Language"
    },
    category: {
      type: String,
      enum: ["science", "arts", "commercial", "general"],
      default: "general",
    },
    isCompulsory: {
      type: Boolean,
      default: false, // English & Math => true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
