// utils/sendEmail.js
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text, html) => {
  const msg = {
    to,
    from: "prajapatit097@gmail.com", // must be verified in SendGrid
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent to", to);
  } catch (err) {
    console.error("SendGrid error:", err.response?.body || err);
  }
};

module.exports = sendEmail;
