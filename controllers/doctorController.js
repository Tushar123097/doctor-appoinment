// controllers/doctorController.js
const User = require("../models/User");

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find(
      { role: "doctor" },
      "-__v -otp -otpExpires"
    );

    res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching doctors",
      error: error.message,
    });
  }
};

module.exports = { getAllDoctors }; 
