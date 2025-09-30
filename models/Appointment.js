const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },   // e.g. "2025-09-28"
  time: { type: String, required: true },   // e.g. "10:30"
  // fees: { type: Number, required: true },
  status: { type: String, enum: ["waiting", "completed"], default: "waiting" },
  token: { type: String, required: true }, // random token for appointment
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
