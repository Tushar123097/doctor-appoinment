const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");

const app = express();

app.use(express.json());
app.use(cors());

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "Backend is working!" });
});

// Debug endpoint to check users
app.get("/api/debug/users", async (req, res) => {
  try {
    const User = require("./models/User");
    console.log("Fetching users from MongoDB...");
    const allUsers = await User.find({}).select("-password");
    
    const userList = allUsers.map(user => ({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      specialty: user.specialty,
      degree: user.degree,
      experience: user.experience,
      fees: user.fees
    }));
    
    console.log("Processed user list:", userList);
    
    res.json({ success: true, users: userList, total: allUsers.length });
  } catch (err) {
    console.error("Debug users error:", err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// Debug endpoint to check configuration
app.get("/api/debug/config", (req, res) => {
  res.json({
    success: true,
    mongoUri: process.env.MONGO_URI ? "Set" : "Not set",
    jwtSecret: process.env.JWT_SECRET ? "Set" : "Not set",
    port: process.env.PORT || 3000
  });
});

// Debug endpoint to check appointments
app.get("/api/debug/appointments", async (req, res) => {
  try {
    const Appointment = require("./models/Appointment");
    const appointments = await Appointment.find({}).limit(10);
    
    const appointmentList = appointments.map(apt => ({
      _id: apt._id.toString(),
      doctorId: apt.doctorId,
      patientId: apt.patientId,
      status: apt.status,
      date: apt.date,
      doctorIdType: typeof apt.doctorId,
      patientIdType: typeof apt.patientId
    }));
    
    res.json({ success: true, appointments: appointmentList, total: appointments.length });
  } catch (err) {
    console.error("Debug appointments error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Debug endpoint to test doctors without auth
app.get("/api/debug/doctors", async (req, res) => {
  try {
    const User = require("./models/User");
    const doctors = await User.find({ role: "doctor" }).select("-password");
    
    const doctorList = doctors.map(doctor => ({
      id: doctor._id.toString(),
      name: doctor.name || "Unknown Doctor",
      email: doctor.email || "",
      role: doctor.role,
      degree: doctor.degree || "",
      specialty: doctor.specialty || "General Practice",
      experience: doctor.experience || "5+ years",
      fees: doctor.fees || 500,
      availability: doctor.availability || [],
      image: "https://randomuser.me/api/portraits/women/68.jpg"
    }));
    
    res.json({ success: true, doctors: doctorList, total: doctors.length });
  } catch (err) {
    console.error("Debug doctors error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Routes (without Clerk middleware for now - we'll handle Clerk in the controller)
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);



// Doctor profile update route
app.put("/api/doctors/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctors can update profile" });
    }

    const { users } = require("@clerk/clerk-sdk-node");
    const { specialty, degree, experience, fees, availability } = req.body;

    const updatedUser = await users.updateUser(decoded.userId, {
      publicMetadata: {
        role: "doctor",
        specialty: specialty || undefined,
        degree: degree || undefined,
        experience: experience || undefined,
        fees: fees || undefined,
        availability: availability || undefined,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      doctor: {
        id: updatedUser.id,
        name: updatedUser.firstName,
        specialty: updatedUser.publicMetadata?.specialty,
        degree: updatedUser.publicMetadata?.degree,
        experience: updatedUser.publicMetadata?.experience,
        fees: updatedUser.publicMetadata?.fees,
        availability: updatedUser.publicMetadata?.availability,
      },
    });
  } catch (err) {
    console.error("Error updating doctor profile:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
