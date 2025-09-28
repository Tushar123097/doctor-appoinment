const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const patientRoutes = require("./routes/patientRoutes");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
// const doctorRoutes = require("./routes/doctorRoutes"); 
// const patientRoutes = require("./routes/patientRoutes");
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/myNewDatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Routes
app.use("/api/auth", authRoutes);

// app.use("/api/patient", patientRoutes);
app.use("/api/appointments", appointmentRoutes);

// app.use("/api", doctorRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);

app.use("/api", appointmentRoutes);
// Serve static files from uploads folder
app.use('/uploads', express.static('uploads'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
