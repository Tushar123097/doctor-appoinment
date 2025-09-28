const jwt = require("jsonwebtoken");
const transporter = require("../utils/nodemailerTransporter");
const User = require("../models/User");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
// const jwt = require("jsonwebtoken");
// Generate 6-digit OTP (digits only)
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------- PATIENT SIGNUP --------------------
exports.patientSignup = async (req, res) => {
  const { name, email } = req.body;

  try {
    let user = await User.findOne({ email, role: "patient" });

    // If user exists, just send the existing OTP again
    if (user) {
      // await transporter.sendMail({
      //   from: `"MyApp Team" <${process.env.EMAIL_USER}>`,
      //   to: email,
      //   subject: "Patient Signup OTP",
      //   text: `Hello ${name},\n\nYour OTP is: ${user.otp}\n\nUse this OTP to login anytime.`,
      // });
      // return res.json({ message: "OTP sent again to your email." });
       sendEmail({
        to: email,
        subject: "Doctor Signup OTP",
        text: `Hello ${name},\n\nYour OTP is: ${user.otp}\n\nUse this OTP to login anytime.`,
      });

      return res.json({ message: "OTP sent again to your email." });
    }

    // Generate OTP only if new user
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user = new User({
      name,
      email,
      role: "patient",
      otp,              // store permanently
      // otpExpires: optional, you can remove or set very long duration
    });

    await user.save();

    await transporter.sendMail({
      from: `"MyApp Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Patient Signup OTP",
      text: `Hello ${name},\n\nYour OTP is: ${otp}\n\nUse this OTP to login anytime.`,
    });

    res.json({ message: "OTP sent to email. Use this OTP to login anytime." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
};


// -------------------- PATIENT VERIFY LOGIN --------------------
exports.patientVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email, role: "patient" });
    if (!user) return res.status(400).json({ error: "Patient not found" });

    // Compare with stored OTP, no expiry check
    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// -------------------- DOCTOR SIGNUP --------------------
exports.doctorSignup = async (req, res) => {
  const { name, email, degree, experience, specialty } = req.body;

  try {
    let user = await User.findOne({ email, role: "doctor" });

    // If doctor already exists, resend existing OTP
    if (user) {
      await transporter.sendMail({
        from: `"MyApp Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Doctor Signup OTP",
        text: `Hello ${name},\n\nYour OTP is: ${user.otp}\n\nUse this OTP to login anytime.`,
      });
      return res.json({ message: "OTP sent again to your email." });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user = new User({
      name,
      email,
      role: "doctor",
      otp,  // store permanently
    });

    await user.save();

    await transporter.sendMail({
      from: `"MyApp Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Doctor Signup OTP",
      text: `Hello ${name},\n\nYour OTP is: ${otp}\n\nUse this OTP to login anytime.`,
    });

    res.json({ message: "Doctor OTP sent to email. Use this OTP to login anytime." });
  } catch (err) {
    console.error("Doctor signup error:", err);
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
};

// -------------------- DOCTOR VERIFY LOGIN --------------------
exports.doctorVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email, role: "doctor" });
    if (!user) return res.status(400).json({ error: "Doctor not found" });

    // Compare with stored OTP (no expiry)
    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Doctor OTP verification error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};
// -------------------- UPDATE DOCTOR PROFILE --------------------
exports.updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { degree, experience, specialty, availability } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (degree) doctor.degree = degree;
    if (experience) doctor.experience = experience;
    if (specialty) doctor.specialty = specialty;

    // Handle availability
    if (availability) {
      /*
        Expect availability as JSON array of objects:
        [
          { "day": "Monday", "from": "10:00", "to": "14:00" },
          { "day": "Tuesday", "from": "10:00", "to": "14:00" }
        ]
      */
      let parsedAvailability;
      if (typeof availability === "string") {
        parsedAvailability = JSON.parse(availability);
      } else {
        parsedAvailability = availability;
      }

      if (Array.isArray(parsedAvailability)) {
        doctor.availability = parsedAvailability;
      } else {
        return res.status(400).json({ error: "Availability must be an array of objects" });
      }
    }

    await doctor.save();
    res.json({ message: "Doctor profile updated successfully", doctor });
  } catch (err) {
    console.error("Update doctor profile error:", err);
    res.status(500).json({ error: "Failed to update profile", details: err.message });
  }
};


// Get patient profile
exports.getPatientProfile = async (req, res) => {
  try {
    console.log("Incoming request for patient profile", req.params.id);

    const patientId = req.params.id;
    const patient = await User.findById(patientId);

    if (!patient) {
      console.log("No user found with this ID");
      return res.status(404).json({ error: "Patient not found" });
    }

    if (patient.role !== "patient") {
      console.log("User found but not a patient:", patient.role);
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({ patient });
  } catch (err) {
    console.error("Get patient profile error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};


// Update patient profile
exports.updatePatientProfile = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { name, email } = req.body; // add more fields if needed

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (name) patient.name = name;
    if (email) patient.email = email;

    await patient.save();

    res.json({ message: "Patient profile updated successfully", patient });
  } catch (err) {
    console.error("Update patient profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
// /  Fetch all registered doctors
exports.getAllDoctors = async (req, res) => {
  try {
    // Find all users with role 'doctor'
    const doctors = await User.find({ role: "doctor" }).select(
      "name email specialty degree experience availability"
    );

    res.json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctors,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};