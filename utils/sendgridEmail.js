// // utils/nodemailerTransporter.js
// const nodemailer = require("nodemailer");
// require("dotenv").config();

// const transporter = nodemailer.createTransport({
//   service: "gmail", // can be hotmail, yahoo, etc.
//   auth: {
//     user: process.env.EMAIL_USER, // your email
//     pass: process.env.EMAIL_PASS, // your app password
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });

// module.exports = transporter;
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = (email, name, otpToSend) => {
  const msg = {
    to: email,
    from: "prajapatit097@gmail.com", // must be verified in SendGrid
    subject: "Patient Signup OTP",
    text: `Hello ${name}, your OTP is ${otpToSend}`,
  };

  sgMail.send(msg)
    .then(() => console.log("OTP email sent"))
    .catch(err => console.error("SendGrid error:", err));
};

module.exports = sendEmail;
