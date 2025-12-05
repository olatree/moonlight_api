const User = require("../models/User");

async function createInitialAdmin() {
  const existingAdmins = await User.countDocuments({ role: "master_admin" });

  if (existingAdmins === 0) {
    console.log("No master_admin found. Creating initial master admin...");

    await User.create({
      name: "Master Admin",
      email: "master@school.com",
      password: "123456", // will be hashed by pre-save hook
      role: "master_admin",
      isBlocked: false
    });

    console.log("Master Admin created successfully.");
  }
}

module.exports = createInitialAdmin;
