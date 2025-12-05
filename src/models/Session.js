// server/models/Session.js
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "2025/2026"
    isActive: { type: Boolean, default: false }, // Only one session active
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
