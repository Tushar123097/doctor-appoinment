const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// Patient can view all doctors (temporarily public for testing)
router.get("/doctors", authController.getAllDoctors);

// Doctor can update their profile
router.put("/profile/:id", authMiddleware, authController.updateProfile);

module.exports = router;
