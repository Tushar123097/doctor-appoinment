// const transporter = require("./nodemailerTransporter");

// const sendEmail = async (to, subject, text, html) => {
//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to,
//       subject,
//       text,
//       html,
//     });
//     console.log("Email sent to", to);
//   } catch (err) {
//     console.error("Email failed:", err);
//   }
// };

// module.exports = sendEmail;
const transporter = require("./nodemailerTransporter");

const sendEmail = async ({ to, subject, text }) => {
  // Send email asynchronously without blocking
  transporter.sendMail({ from: `"MyApp Team" <${process.env.EMAIL_USER}>`, to, subject, text })
    .catch(err => console.error("Email sending failed:", err.message));
};

module.exports = sendEmail;
