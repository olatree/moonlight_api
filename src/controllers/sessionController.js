const Session = require("../models/Session");
const Term = require("../models/Term");

// -------------------------
// Create a new session
// -------------------------
exports.createSession = async (req, res) => {
  const { name } = req.body;

  try {
    const existing = await Session.findOne({ name });
    if (existing) {
      return res
        .status(400)
        .json({ message: `Session "${name}" already exists` });
    }

    const session = await Session.create({ name });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------
// Get all sessions with terms
// -------------------------
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find().lean();

    // Populate terms for each session
    const sessionsWithTerms = await Promise.all(
      sessions.map(async (s) => {
        const terms = await Term.find({ session: s._id });
        return { ...s, terms };
      })
    );

    res.json(sessionsWithTerms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------
// Create a term for a session
// -------------------------
exports.createTerm = async (req, res) => {
  const { sessionId } = req.params;
  const { name } = req.body;

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Check if term already exists
    const existingTerm = await Term.findOne({ name, session: sessionId });
    if (existingTerm) {
      return res
        .status(400)
        .json({ message: `Term "${name}" already exists for this session` });
    }

    const term = await Term.create({ name, session: sessionId });
    res.status(201).json(term);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------
// Activate a session
// -------------------------
exports.activateSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Deactivate all sessions
    await Session.updateMany({}, { isActive: false });

    // Activate the selected session
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { isActive: true },
      { new: true }
    );

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------
// Activate a term for a session
// -------------------------
exports.activateTerm = async (req, res) => {
  const { termId } = req.params;

  try {
    const term = await Term.findById(termId);
    if (!term) return res.status(404).json({ message: "Term not found" });

    // Deactivate all terms in this session
    await Term.updateMany({ session: term.session }, { isActive: false });

    term.isActive = true;
    await term.save();

    res.json(term);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get current active session and term
// @route GET /api/sessions/active
// @access Private (Super Admin/Admin)
exports.getActiveSessionTerm = async (req, res) => {
  try {
    // Find active session
    const activeSession = await Session.findOne({ isActive: true }).lean();
    if (!activeSession) {
      return res.status(404).json({ message: "No active session found" });
    }

    // Find active term for that session
    const activeTerm = await Term.findOne({
      session: activeSession._id,
      isActive: true,
    }).lean();

    res.json({ session: activeSession, term: activeTerm || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};