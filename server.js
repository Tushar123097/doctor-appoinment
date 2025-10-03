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
    console.log("Fetching users from Clerk...");
    const response = await users.getUserList({ limit: 10 });
    console.log("Clerk response:", response);
    const allUsers = response.users || [];
    
    const userList = allUsers.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      role: user.publicMetadata?.role,
      firstName: user.firstName,
      fullMetadata: user.publicMetadata
    }));
    
    console.log("Processed user list:", userList);
    
    res.json({ success: true, users: userList, total: allUsers.length });
  } catch (err) {
    console.error("Debug users error:", err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// Debug endpoint to check Clerk configuration
app.get("/api/debug/clerk", (req, res) => {
  res.json({
    success: true,
    clerkSecretKey: process.env.CLERK_SECRET_KEY ? "Set" : "Not set",
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ? "Set" : "Not set",
    jwtSecret: process.env.JWT_SECRET ? "Set" : "Not set"
  });
});

// Fix user role endpoint (for debugging)
app.post("/api/debug/fix-user-role", async (req, res) => {
  try {
    const { email, role } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ success: false, message: "Email and role are required" });
    }

    const { users } = require("@clerk/clerk-sdk-node");
    const response = await users.getUserList({ limit: 100 });
    const allUsers = response.users || [];
    
    const user = allUsers.find(u => 
      u.emailAddresses.some(emailObj => emailObj.emailAddress.toLowerCase() === email.toLowerCase())
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user role
    const updatedUser = await users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        role: role
      }
    });

    res.json({
      success: true,
      message: "User role updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        role: updatedUser.publicMetadata?.role
      }
    });
  } catch (err) {
    console.error("Fix user role error:", err);
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
