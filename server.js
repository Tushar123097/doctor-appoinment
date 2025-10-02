const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");

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
    const { users } = require("@clerk/clerk-sdk-node");
    const response = await users.getUserList({ limit: 10 });
    const allUsers = response.users || [];
    
    const userList = allUsers.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      role: user.publicMetadata?.role,
      firstName: user.firstName
    }));
    
    res.json({ success: true, users: userList, total: allUsers.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Routes (without Clerk middleware for now - we'll handle Clerk in the controller)
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
