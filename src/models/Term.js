const mongoose = require("mongoose");

const termSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["1st Term", "2nd Term", "3rd Term"],
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false, // only one active term per session
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Term", termSchema);
