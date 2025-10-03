// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN"
//     if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(401).json({ success: false, message: "User not found" });

//     req.user = user; // attach user to request
//     next();
//   } catch (err) {
//     res.status(401).json({ success: false, message: "Invalid token" });
//   }
// };

// module.exports = authMiddleware;
// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from MongoDB to ensure they still exist
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

module.exports = authMiddleware;
