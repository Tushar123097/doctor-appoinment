const Appointment = require("../models/Appointment");
const User = require("../models/User");

/**
 * Book an appointment
 * POST /appointments/book
 * Body: { doctorId, date, symptoms }
 * patientId comes from logged-in user
 */
exports.bookAppointment = async (req, res) => {
  try {
    console.log("=== BOOKING APPOINTMENT ===");
    console.log("Request body:", req.body);
    console.log("User from token:", req.user);

    const { doctorId, date, symptoms } = req.body;
    const patientId = req.user.userId; // From JWT token

    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: "Doctor ID and date are required" });
    }

    // Generate token number (simple sequential for now)
    const existingAppointments = await Appointment.find({ doctorId, date });
    const tokenNumber = existingAppointments.length + 1;

    // Create appointment with status 'waiting'
    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
      symptoms: symptoms || "General consultation",
      status: "waiting",
      token: tokenNumber,
      fees: 500, // Default fee
    });

    await appointment.save();

    console.log("Appointment created:", appointment);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: {
        id: appointment._id,
        doctorId: appointment.doctorId,
        date: appointment.date,
        token: appointment.token,
        status: appointment.status,
        fees: appointment.fees
      }
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
    console.log("=== GET PATIENT APPOINTMENTS ===");
    console.log("User from token:", req.user);

    const patientId = req.user.userId;
    console.log("Looking for appointments for patient:", patientId);

    const appointments = await Appointment.find({ patientId }).sort({ createdAt: -1 });
    console.log("Found appointments:", appointments.length);

    // Enhance appointments with doctor info
    const enhancedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          // Get doctor info from MongoDB
          const doctor = await User.findById(appointment.doctorId).select("-password");
          return {
            ...appointment.toObject(),
            doctor: {
              name: doctor?.name || "Unknown Doctor",
              email: doctor?.email || "",
              specialty: doctor?.specialty || "General Practice"
            }
          };
        } catch (err) {
          console.error("Error fetching doctor info:", err);
          return {
            ...appointment.toObject(),
            doctor: {
              name: "Unknown Doctor",
              email: "",
              specialty: "General Practice"
            }
          };
        }
      })
    );

    console.log("Enhanced appointments:", enhancedAppointments);
    res.json(enhancedAppointments);
  } catch (err) {
    console.error("Error fetching patient appointments:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all appointments for a doctor
 */
exports.getDoctorAppointments = async (req, res) => {
  try {
    console.log("=== GET DOCTOR APPOINTMENTS ===");
    console.log("User from token:", req.user);

    const doctorId = req.user.userId;
    const { status } = req.query;

    const query = { doctorId };
    if (status) query.status = status;

    console.log("Query:", query);

    const appointments = await Appointment.find(query).sort({ createdAt: -1 });
    console.log("Found appointments:", appointments.length);

    // Enhance appointments with patient info
    const enhancedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          // Get patient info from MongoDB
          const patient = await User.findById(appointment.patientId).select("-password");
          return {
            ...appointment.toObject(),
            patient: {
              name: patient?.name || "Unknown Patient",
              email: patient?.email || "",
              phone: patient?.phone || "No phone"
            }
          };
        } catch (err) {
          console.error("Error fetching patient info:", err);
          return {
            ...appointment.toObject(),
            patient: {
              name: "Unknown Patient",
              email: "",
              phone: "No phone"
            }
          };
        }
      })
    );

    console.log("Enhanced appointments:", enhancedAppointments);
    res.json(enhancedAppointments);
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
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
    console.log("=== UPDATE APPOINTMENT STATUS ===");
    console.log("User from token:", req.user);
    console.log("Appointment ID:", req.params.id);
    console.log("New status:", req.body.status);

    const doctorId = req.user.userId;
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["waiting", "confirmed", "completed", "cancelled"];
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

    console.log("Appointment status updated successfully");

    res.json({ success: true, message: "Appointment status updated", appointment });
  } catch (err) {
    console.error("Error updating appointment status:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
