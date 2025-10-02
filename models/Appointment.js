const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Clerk user ID of patient
  doctorId: { type: String, required: true },  // Clerk user ID of doctor
  date: { type: String, required: true },      // e.g. "2025-09-28"
  time: { type: String, required: true },      // e.g. "10:30"
  status: { 
    type: String, 
    enum: ["waiting", "approved", "completed", "cancelled"], 
    default: "waiting" 
  },
  token: { type: String, required: true },     // random token for appointment
  fees: { type: Number, default: 0 },          // optional fees
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
