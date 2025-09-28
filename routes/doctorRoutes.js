// routes/doctorRoutes.js
const express = require("express");
const { getAllDoctors } = require("../controllers/doctorController");
const authController = require("../controllers/authController");

const router = express.Router();

// Patient can view doctors
router.get("/doctors", getAllDoctors);
// Update doctor profile
router.put("/profile/:id", authController.updateDoctorProfile);

module.exports = router;
