// server/routes/adminRoutes.js
const express = require("express");
const multer = require("multer");
const { protect, restrictToRoles } = require("../middleware/authMiddleware");

const {
  createPrincipal,
  getPrincipals,
  updatePrincipal,
  deletePrincipal,
} = require("../controllers/principalController");

const router = express.Router();

// only super_admin can manage admins
// router.use(protect, restrictToRoles("super_admin"));

// Important: Use memoryStorage so file is available as buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

router.post(
  "/",
  upload.fields([
    { name: "picture", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  createPrincipal
);

router.put(
  "/:id",
  upload.fields([
    { name: "picture", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  updatePrincipal
);

// create a new admin
// router.post("/", createPrincipal);

// view all admins
router.get("/", getPrincipals);

// update an admin (role, name, email, block/unblock)
// router.put("/:id", updatePrincipal);

// delete an admin
router.delete("/:id", deletePrincipal);

module.exports = router;
