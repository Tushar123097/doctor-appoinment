const Appointment = require("../models/Appointment");
const { users } = require("@clerk/clerk-sdk-node");

/**
 * Book an appointment
 * POST /appointments
 * Body: { doctorId, date, time, fees }
 * patientId comes from logged-in user
 */
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, fees } = req.body;
    const patientId = req.user.id; // Clerk userId of logged-in patient

    // Check doctor exists in Clerk
    const doctor = await users.getUser(doctorId);
    if (!doctor || doctor.publicMetadata.role !== "doctor") {
      return res.status(400).json({ success: false, message: "Invalid doctor" });
    }

    // Check patient exists in Clerk
    const patient = await users.getUser(patientId);
    if (!patient || patient.publicMetadata.role !== "patient") {
      return res.status(400).json({ success: false, message: "Invalid patient" });
    }

    // Create appointment with status 'waiting'
    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
      time,
      fees,
      status: "waiting",
      token: Math.floor(100000 + Math.random() * 900000).toString(),
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment,
    });
  } catch (err) {
    console.error("Booking failed:", err);
    res.status(500).json({ success: false, message: "Booking failed", error: err.message });
  }
};

/**
 * Get all appointments of a patient
 */
exports.getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 });

    res.json({ success: true, message: "Appointments fetched", data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all appointments for a doctor
 */
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status } = req.query;

    const query = { doctorId };
    if (status) query.status = status;

    const appointments = await Appointment.find(query).sort({ createdAt: -1 });

    res.json({ success: true, message: "Appointments fetched", data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update appointment status
 * PUT /appointments/:id/status
 * Body: { status }
 */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["waiting", "approved", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Check doctor owns appointment
    if (appointment.doctorId !== doctorId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Update status
    appointment.status = status;
    await appointment.save();

    // Emails disabled for now
    // Do not send emails on status update

    res.json({ success: true, message: "Appointment status updated", appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
