const express = require("express");
const { 
  bookAppointment, 
  getPatientAppointments, 
  getDoctorAppointments, 
  updateAppointmentStatus 
} = require("../controllers/appointmentController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Patient routes
router.get("/patient", authMiddleware, getPatientAppointments);   // ✅ Patient gets his appointments
router.post("/appointments/book", authMiddleware, bookAppointment);

// Doctor routes
router.get("/doctor/appointments", authMiddleware, getDoctorAppointments);  // ✅ Doctor gets his appointments
router.patch("/appointments/:id/status", authMiddleware, updateAppointmentStatus);

module.exports = router;
