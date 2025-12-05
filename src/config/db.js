// server/config/db.js
const mongoose = require("mongoose");
const createInitialAdmin = require("../utils/createInitialAdmin");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Create master admin automatically at first launch
    await createInitialAdmin();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
