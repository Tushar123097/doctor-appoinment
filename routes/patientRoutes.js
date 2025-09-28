const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Patient profile routes
router.get("/profile/:id", authController.getPatientProfile);
router.put("/profile/:id", authController.updatePatientProfile);

module.exports = router;
