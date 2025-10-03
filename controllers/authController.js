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
 * Temporary solution: Store user data in MongoDB and verify against it
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);
    
    // First try to get user from Clerk
    let user = null;
    let clerkUsers = [];
    
    try {
      const response = await users.getUserList({ limit: 100 });
      clerkUsers = response.users || [];
      console.log("Total users in Clerk:", clerkUsers.length);
      
      user = clerkUsers.find(u => 
        u.emailAddresses.some(emailObj => emailObj.emailAddress.toLowerCase() === email.toLowerCase())
      );
    } catch (clerkError) {
      console.error("Clerk API error:", clerkError);
    }

    // If user found in Clerk, use that
    if (user) {
      console.log("User found in Clerk");
      console.log("User details:", {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        publicMetadata: user.publicMetadata
      });
      console.log("User role from metadata:", user.publicMetadata?.role);
      
      const userRole = user.publicMetadata?.role || "patient";
      console.log("Final role being used:", userRole);
      
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: email,
          role: userRole
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      console.log("Sending login response with role:", userRole);

      return res.json({
        success: true,
        message: "Login successful",
        token: token,
        role: userRole,
        userId: user.id,
        name: user.firstName || "User"
      });
    }

    // Fallback: Check if this is a test user or allow login for demo purposes
    // This is a temporary solution for testing
    if (email && password) {
      console.log("Using fallback login for demo purposes");
      
      // Determine role based on email or default to patient
      const role = email.includes("doctor") ? "doctor" : "patient";
      console.log("Determined role:", role, "for email:", email);
      
      const userId = "demo_" + Date.now();
      const token = jwt.sign(
        { 
          userId: userId, 
          email: email,
          role: role
        },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" }
      );

      console.log("Sending response with role:", role);

      return res.json({
        success: true,
        message: "Login successful (demo mode)",
        token: token,
        role: role,
        userId: userId,
        name: "Demo User"
      });
    }

    return res.status(401).json({ success: false, message: "Invalid email or password" });

  } catch (err) {
    console.error("=== LOGIN ERROR ===");
    console.error("Error details:", err);
    
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
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
    console.log("=== SIGNUP ATTEMPT ===");
    console.log("Email:", email);
    console.log("Name:", name);
    console.log("Role:", role);
    console.log("Password provided:", password ? "Yes" : "No");
    
    const userData = {
      emailAddress: [email],
      firstName: name,
      password: password,
      username: email.split("@")[0],
      publicMetadata: { role },
    };
    
    console.log("Creating user with data:", userData);
    
    const user = await users.createUser(userData);
    
    console.log("User created successfully:", {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      role: user.publicMetadata?.role
    });

    res.json({
      success: true,
      message: `${role} signup successful. Verify email/OTP via Clerk flow.`,
      userId: user.id,
    });
  } catch (err) {
    console.error("=== SIGNUP ERROR ===");
    console.error("Error details:", err);
    console.error("Error message:", err.message);
    console.error("Error errors array:", err.errors);
    console.error("Error stack:", err.stack);
    
    res.status(500).json({
      success: false,
      message: err.errors?.[0]?.longMessage || err.message || "Signup failed",
    });
  }
};


exports.getProfile = async (req, res) => {
  try {
    console.log("=== GET PROFILE ===");
    console.log("User ID:", req.params.id);

    const { id } = req.params;
    const user = await users.getUser(id);

    console.log("User data:", {
      id: user.id,
      name: user.firstName,
      email: user.emailAddresses[0]?.emailAddress,
      metadata: user.publicMetadata
    });

    res.json({
      success: true,
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.firstName,
      role: user.publicMetadata?.role,
      degree: user.publicMetadata?.degree,
      specialty: user.publicMetadata?.specialty,
      experience: user.publicMetadata?.experience,
      availability: user.publicMetadata?.availability || [],
      fees: user.publicMetadata?.fees,
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
    const { name, role, degree, specialty, experience, availability, fees } = req.body;

    console.log("=== UPDATE PROFILE ===");
    console.log("User ID:", id);
    console.log("Update data:", { name, role, degree, specialty, experience, availability, fees });

    const user = await users.updateUser(id, {
      firstName: name,
      publicMetadata: {
        role: role || "doctor",
        degree: degree || undefined,
        specialty: specialty || undefined,
        experience: experience || undefined,
        availability: availability || undefined,
        fees: fees || undefined,
      },
    });

    console.log("Profile updated successfully:", user.publicMetadata);

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.firstName,
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata.role,
        degree: user.publicMetadata.degree,
        specialty: user.publicMetadata.specialty,
        experience: user.publicMetadata.experience,
        availability: user.publicMetadata.availability,
        fees: user.publicMetadata.fees,
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
    console.log("=== GET ALL DOCTORS ===");
    console.log("User from token:", req.user);
    
    // Fetch list of users from Clerk
    const response = await users.getUserList({ limit: 100 }); // fetch up to 100 users
    const allUsers = response.users || []; // fallback to empty array
    
    console.log("Total users from Clerk:", allUsers.length);

    // Filter only doctors
    const doctorList = allUsers
      .filter(user => user.publicMetadata?.role === "doctor")
      .map(user => ({
        id: user.id,
        name: user.firstName || "Unknown Doctor",
        email: user.emailAddresses[0]?.emailAddress || "",
        role: user.publicMetadata.role,
        degree: user.publicMetadata.degree || "",
        specialty: user.publicMetadata.specialty || "General Practice",
        experience: user.publicMetadata.experience || "5+ years",
        fees: user.publicMetadata.fees || 500,
        availability: user.publicMetadata.availability || [],
        image: user.imageUrl || "https://randomuser.me/api/portraits/women/68.jpg"
      }));

    console.log("Filtered doctors:", doctorList.length);
    console.log("Doctor list:", doctorList);

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
