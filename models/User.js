const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["patient", "doctor"], required: true },
  
  // Doctor-specific fields
  degree: { type: String },
  experience: { type: String },
  specialty: { type: String },
  fees: { type: Number, default: 500 },
  availability: [
    {
      day: String,   // e.g., "Monday"
      from: String,  // e.g., "10:00"
      to: String,    // e.g., "15:00"
    },
  ],
  
  // Patient-specific fields
  phone: { type: String },
  address: { type: String },
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
