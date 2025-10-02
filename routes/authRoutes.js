const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Patient signup
router.post("/patient/signup", authController.signup);

// Doctor signup ✅
router.post("/doctor/signup", authController.signup);

// Get profile by ID
router.get("/profile/:id", authController.getProfile);

// Update profile
router.put("/profile/:id", authController.updateProfile);

// Get all doctors
router.get("/doctors", authController.getAllDoctors);

module.exports = router;
