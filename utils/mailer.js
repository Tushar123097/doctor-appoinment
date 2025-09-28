const transporter = require("./nodemailerTransporter");

const sendEmail = async (to, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent to", to);
  } catch (err) {
    console.error("Email failed:", err);
  }
};

module.exports = sendEmail;
