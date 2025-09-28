const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// Patient signup & verify
router.post("/patient/signup", authController.patientSignup);
router.post("/patient/verify-otp", authController.patientVerifyOtp);

// Doctor signup & verify
router.post("/doctor/signup", authController.doctorSignup);
router.post("/doctor/verify-otp", authController.doctorVerifyOtp);

// Doctor profile update (text only, no photo)
// router.put("/doctor/profile/:id", authController.updateDoctorProfile);
// router.put("/profile/:id", authController.updateDoctorProfile);
// router.put("/profile/:id", authController.updateDoctorProfile);


// Patient sees all registered doctors
router.get("/doctors", authMiddleware, authController.getAllDoctors);

module.exports = router;
