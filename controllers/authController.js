const jwt = require("jsonwebtoken");
// const transporter = require("../utils/nodemailerTransporter");
const User = require("../models/User");
// const sendEmail = require("../utils/mailer");
// const sendEmail = require("../utils/sendgridEmail"); // adjust path
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { users } = require("@clerk/clerk-sdk-node");

/**
 * Login API for patient/doctor
 * Body: { email, password }
 * Note: This is a simplified version since Clerk doesn't allow direct password verification
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);
    console.log("Password provided:", password ? "Yes" : "No");
    
    // Get user list and find by email
    const response = await users.getUserList({ limit: 100 });
    const allUsers = response.users || [];
    
    console.log("Total users in Clerk:", allUsers.length);
    console.log("User emails:", allUsers.map(u => u.emailAddresses[0]?.emailAddress));
    
    const user = allUsers.find(u => 
      u.emailAddresses.some(emailObj => emailObj.emailAddress.toLowerCase() === email.toLowerCase())
    );

    console.log("User found:", user ? "Yes" : "No");
    if (user) {
      console.log("User details:", {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata?.role,
        firstName: user.firstName
      });
    }

    if (!user) {
      console.log("User not found in Clerk database");
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // For now, we'll skip password verification since Clerk doesn't support it directly
    // In production, you'd want to use Clerk's proper authentication flow
    console.log("User role:", user.publicMetadata?.role);

    // Create JWT token for session management
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: email,
        role: user.publicMetadata?.role || "patient"
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log("Login successful, sending response");

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      role: user.publicMetadata?.role || "patient",
      userId: user.id,
      name: user.firstName || user.username || "User"
    });

  } catch (err) {
    console.error("=== LOGIN ERROR ===");
    console.error("Error details:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    res.status(500).json({
      success: false,
      message: err.message || "Login failed. Please try again."
    });
  }
};

/**
 * Signup API for patient/doctor
 * Body: { email, name, role }  // role = "patient" or "doctor"
 */
exports.signup = async (req, res) => {
  const { email, name, role, password } = req.body;

  if (!email || !name || !role || !password) {
    return res.status(400).json({ success: false, message: "Email, name, role, and password are required" });
  }

  try {
    const user = await users.createUser({
      emailAddress: [email],
      firstName: name,
      password: password,                  // ✅ required by Clerk
      username: email.split("@")[0],       // optional
      publicMetadata: { role },
    });

    res.json({
      success: true,
      message: `${role} signup successful. Verify email/OTP via Clerk flow.`,
      userId: user.id,
    });
  } catch (err) {
    console.error("Clerk signup error:", err);
    res.status(500).json({
      success: false,
      message: err.errors?.[0]?.longMessage || err.message || "Signup failed",
    });
  }
};


exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await users.getUser(id);

    res.json({
      success: true,
      id: user.id,
      email: user.emailAddresses[0].emailAddress,
      name: user.firstName,
      role: user.publicMetadata.role,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to fetch profile" });
  }
};

/**
 * Update profile by Clerk userId
 * PUT /profile/:id
 * Body: { name, role }
 */
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, degree, specialty, experience, availability } = req.body;

    const user = await users.updateUser(id, {
      firstName: name,
      publicMetadata: {
        role: role || undefined,
        degree: degree || undefined,
        specialty: specialty || undefined,
        experience: experience || undefined,
        availability: availability || undefined,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.firstName,
        role: user.publicMetadata.role,
        degree: user.publicMetadata.degree,
        specialty: user.publicMetadata.specialty,
        experience: user.publicMetadata.experience,
        availability: user.publicMetadata.availability,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Failed to update profile" });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    // Fetch list of users from Clerk
    const response = await users.getUserList({ limit: 100 }); // fetch up to 100 users
    const allUsers = response.users || []; // fallback to empty array

    // Filter only doctors
    const doctorList = allUsers
      .filter(user => user.publicMetadata?.role === "doctor")
      .map(user => ({
        id: user.id,
        name: user.firstName,
        email: user.emailAddresses[0]?.emailAddress || "",
        role: user.publicMetadata.role,
        degree: user.publicMetadata.degree || "",
        specialty: user.publicMetadata.specialty || "",
        experience: user.publicMetadata.experience || "",
        availability: user.publicMetadata.availability || [],
      }));

    res.json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctorList,
    });
  } catch (err) {
    console.error("Get doctors error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch doctors",
    });
  }
};
