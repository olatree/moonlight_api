// server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const sessionRoutes = require("./src/routes/sessionRoutes");
const classRoutes = require("./src/routes/classRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const principalRoutes = require("./src/routes/principalRoutes");
const teacherRoutes = require("./src/routes/teacherRoutes");
const subjectRoutes = require("./src/routes/SubjectRoutes");
const subjectAssignmentRoutes = require("./src/routes/subjectAssignmentRoutes");
const teacherAssignmentRoutes = require("./src/routes/teacherAssignmentRoutes")
const classTeacherRoutes = require("./src/routes/classTeacherRoutes")
const studentRoutes = require("./src/routes/studentRoutes");
const resultRoutes = require("./src/routes/resultRoutes");
const teacherAuthRoutes = require("./src/routes/teachersAuthRoutes");
const termReportRoutes = require("./src/routes/termReportRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");

const app = express();

// connect to MongoDB
connectDB();

// middleware
app.use(express.json());
app.use(cookieParser());

// CORS for frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// routes (temporary test route)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: "connected", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/principals", principalRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/subject-assignments", subjectAssignmentRoutes);
app.use("/api/teacher-assignments", teacherAssignmentRoutes);
app.use("/api/class-teachers", classTeacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/teachers-auth", teacherAuthRoutes);
app.use("/api/term-reports", termReportRoutes);
app.use("/api/attendance", attendanceRoutes);


// server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});
