const mongoose = require("mongoose");

const armSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "A", "B"
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Arm", armSchema);
