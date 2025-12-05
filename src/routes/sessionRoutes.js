// const express = require("express");
// const router = express.Router();
// const sessionController = require("../controllers/sessionController");
// const { protect, restrictToRoles } = require("../middleware/authMiddleware");

// // --- Sessions Routes ---

// // Create a new session
// router.post(
//   "/",
//   protect,
//   restrictToRoles("super_admin"),
//   sessionController.createSession
// );

// // Get all sessions
// router.get(
//   "/",
//   protect,
//   restrictToRoles("super_admin"),
//   sessionController.getSessions
// );

// // --- Terms Routes ---

// // Create a new term for a session
// router.post(
//   "/:sessionId/terms",
//   protect,
//   restrictToRoles("super_admin"),
//   sessionController.createTerm
// );

// // Get all terms for a session
// router.get(
//   "/:sessionId/terms",
//   protect,
//   restrictToRoles("super_admin"),
//   sessionController.getTerms
// );

// // Activate a term
// router.put(
//   "/terms/:termId/activate",
//   protect,
//   restrictToRoles("super_admin"),
//   sessionController.activateTerm
// );

// module.exports = router;


const express = require("express");
const router = express.Router();
const sessionsController = require("../controllers/sessionController");
const { protect, restrictToRoles } = require("../middleware/authMiddleware");

// Sessions
router.get("/", sessionsController.getSessions);
router.post("/", protect, restrictToRoles("super_admin", "master_admin"), sessionsController.createSession);
router.put("/:sessionId/activate", protect, restrictToRoles("super_admin", "master_admin"), sessionsController.activateSession);

// Terms
router.post("/:sessionId/terms", protect, restrictToRoles("super_admin", "master_admin"), sessionsController.createTerm);
router.put("/terms/:termId/activate", protect, restrictToRoles("super_admin", "master_admin"), sessionsController.activateTerm);
router.get("/active", sessionsController.getActiveSessionTerm);

module.exports = router;
