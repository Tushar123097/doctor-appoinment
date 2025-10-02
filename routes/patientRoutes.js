const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// Patient profile routes (Clerk-based)
router.get("/profile/:id", authMiddleware, authController.getProfile);
router.put("/profile/:id", authMiddleware, authController.updateProfile);

module.exports = router;
