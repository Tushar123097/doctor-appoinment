const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true }, // Clerk user ID
  photo: { type: String },         // file path or URL
  degree: { type: String },
  experience: { type: String },
  specialty: { type: String },
  fees: { type: Number },
  availability: [
    {
      day: String,   // e.g., "Monday"
      from: String,  // e.g., "10:00"
      to: String,    // e.g., "15:00"
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);
