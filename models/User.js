const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true }, // "patient" or "doctor"
  otp: { type: String },
  otpExpires: { type: Number },

  // Doctor fields
  photo: { type: String },         // store file path or URL
  degree: { type: String },
  experience: { type: String },
  specialty: { type: String },
  fees: { type: Number }, 
  availability: [
    {
      day: String,
      from: String,
      to: String,
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
