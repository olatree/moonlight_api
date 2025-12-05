const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., "JSS 1"
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
