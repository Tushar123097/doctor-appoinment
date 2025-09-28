// utils/nodemailerTransporter.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail", // can be hotmail, yahoo, etc.
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your app password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
