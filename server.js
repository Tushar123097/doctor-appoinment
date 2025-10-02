const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");

const app = express();

// Clerk middleware
app.use(ClerkExpressWithAuth({
  apiKey: process.env.CLERK_SECRET_KEY,
}));

app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
