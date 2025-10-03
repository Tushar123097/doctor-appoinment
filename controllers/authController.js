const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Login API for patient/doctor
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  try {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);

    // Find user in MongoDB
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log("User not found");
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    console.log("User found:", {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    console.log("Password valid, creating token");

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    console.log("Login successful for role:", user.role);

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      role: user.role,
      userId: user._id,
      name: user.name
    });

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
 * Body: { email, name, role, password }
 */
exports.signup = async (req, res) => {
  const { email, name, role, password } = req.body;

  if (!email || !name || !role || !password) {
    return res.status(400).json({ success: false, message: "Email, name, role, and password are required" });
  }

  if (!["patient", "doctor"].includes(role)) {
    return res.status(400).json({ success: false, message: "Role must be either 'patient' or 'doctor'" });
  }

  try {
    console.log("=== SIGNUP ATTEMPT ===");
    console.log("Email:", email);
    console.log("Name:", name);
    console.log("Role:", role);

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log("User already exists");
      return res.status(400).json({ success: false, message: "User with this email already exists" });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password, // Will be hashed by the pre-save middleware
      role
    });

    await user.save();

    console.log("User created successfully:", {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.json({
      success: true,
      message: `${role} signup successful!`,
      userId: user._id,
    });
  } catch (err) {
    console.error("=== SIGNUP ERROR ===");
    console.error("Error details:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Signup failed. Please try again."
    });
  }
};


exports.getProfile = async (req, res) => {
  try {
    console.log("=== GET PROFILE ===");
    console.log("User ID:", req.params.id);

    const { id } = req.params;
    const user = await User.findById(id).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("User data:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    res.json({
      success: true,
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      degree: user.degree,
      specialty: user.specialty,
      experience: user.experience,
      availability: user.availability || [],
      fees: user.fees,
      phone: user.phone,
      address: user.address
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to fetch profile" });
  }
};

/**
 * Update profile by user ID
 * PUT /profile/:id
 * Body: { name, degree, specialty, experience, availability, fees, phone, address }
 */
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, degree, specialty, experience, availability, fees, phone, address } = req.body;

    console.log("=== UPDATE PROFILE ===");
    console.log("User ID:", id);
    console.log("Update data:", { name, degree, specialty, experience, availability, fees, phone, address });

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (degree) user.degree = degree;
    if (specialty) user.specialty = specialty;
    if (experience) user.experience = experience;
    if (availability) user.availability = availability;
    if (fees) user.fees = fees;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();

    console.log("Profile updated successfully");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        degree: user.degree,
        specialty: user.specialty,
        experience: user.experience,
        availability: user.availability,
        fees: user.fees,
        phone: user.phone,
        address: user.address
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
    
    // Fetch all doctors from MongoDB
    const doctors = await User.find({ role: "doctor" }).select("-password");
    
    console.log("Total doctors found:", doctors.length);

    // Format doctor list
    const doctorList = doctors.map(doctor => ({
      id: doctor._id,
      name: doctor.name || "Unknown Doctor",
      email: doctor.email || "",
      role: doctor.role,
      degree: doctor.degree || "",
      specialty: doctor.specialty || "General Practice",
      experience: doctor.experience || "5+ years",
      fees: doctor.fees || 500,
      availability: doctor.availability || [],
      image: "https://randomuser.me/api/portraits/women/68.jpg" // Default image
    }));

    console.log("Formatted doctor list:", doctorList);

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
