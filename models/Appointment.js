const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true }, // Clerk user ID of patient
  doctorId: { type: String, required: true },  // Clerk user ID of doctor
  date: { type: String, required: true },      // e.g. "2025-09-28"
  symptoms: { type: String, required: true },  // Patient symptoms
  status: { 
    type: String, 
    enum: ["waiting", "confirmed", "completed", "cancelled"], 
    default: "waiting" 
  },
  token: { type: Number, required: true },     // token number for appointment
  fees: { type: Number, default: 500 },        // appointment fees
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
