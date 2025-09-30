const Appointment = require("../models/Appointment");
const User = require("../models/User");
const sendEmail = require("../utils/mailer");
// At the top of your appointmentController.js
const transporter = require("../utils/sendgridEmail"); // adjust the path if needed

// Helper to generate random token
const generateToken = () => Math.floor(100000 + Math.random() * 900000).toString();


exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, fees } = req.body;
    const patientId = req.user._id; // logged-in patient

    // Fetch doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(400).json({ success: false, message: "Invalid doctor" });
    }

    // Fetch patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(400).json({ success: false, message: "Invalid patient" });
    }

    // Create appointment with status 'waiting'
    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
      time,
      // fees,
      status: "waiting", // ✅ default status
      token: Math.floor(100000 + Math.random() * 900000).toString(),
    });

    await appointment.save();

    // Prepare email to patient
    const subject = "Appointment Booked Successfully";
    const text = `Hello ${patient.name}, Your appointment with Dr. ${doctor.name} is confirmed.
Date: ${date}
Time: ${time}
Token: ${appointment.token}
Fees: ₹${fees}
Status: ${appointment.status}`;

    const html = `<h3>Hello ${patient.name}</h3>
<p>Your appointment with Dr. <b>${doctor.name}</b> is confirmed.</p>
<p><b>Date:</b> ${date} <br/>
<b>Time:</b> ${time} <br/>
<b>Token:</b> ${appointment.token} <br/>
<b>Fees:</b> ₹${fees} <br/>
<b>Status:</b> ${appointment.status}</p>
<p>Thank you!</p>`;

    // Send email using friendly sender name
    await sendEmail(
      patient.email,
      subject,
      text,
      html,
      '"Hospital Management" <prajapatit097@gmail.com>' // replace with your email
    );

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
// module.exports = { bookAppointment };

// 🆕 Get all appointments of a patient

exports.getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user._id;

    const appointments = await Appointment.find({ patientId })
      .populate("doctorId", "name email specialty degree experience photo availability")
      .sort({ createdAt: -1 });

    res.json({ success: true, message: "Appointments fetched", data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🆕 Get all appointments for a doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { status } = req.query;

    const query = { doctorId };
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
      .populate("patientId", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, message: "Appointments fetched", data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// 🆕 Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const doctorId = req.user._id; // logged-in doctor
    const { id } = req.params;
    const { status } = req.body; // new status from doctor

    // Allowed statuses
    const allowedStatuses = ["waiting", "approved", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const appointment = await Appointment.findById(id).populate("patientId", "email name");
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Check if logged-in doctor owns this appointment
    if (!appointment.doctorId.equals(doctorId)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Update status
    appointment.status = status;
    await appointment.save();

    // Email content based on status
    let subject, text;
    if (status === "completed") {
      subject = "Checkup Completed";
      text = `Hello ${appointment.patientId.name},\n\nYour checkup with Dr. ${req.user.name} is completed.`;
    } else if (status === "approved") {
      subject = "Appointment Approved";
      text = `Hello ${appointment.patientId.name},\n\nYour appointment with Dr. ${req.user.name} has been approved.`;
    } else if (status === "cancelled") {
      subject = "Appointment Cancelled";
      text = `Hello ${appointment.patientId.name},\n\nYour appointment with Dr. ${req.user.name} has been cancelled.`;
    }

    // Send email only if needed
    if (subject) {
      await transporter.sendMail({
        from: `"Hospital Management" <${process.env.EMAIL_USER}>`,
        to: appointment.patientId.email,
        subject,
        text,
      });
    }

    res.json({ success: true, message: "Appointment status updated", appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
