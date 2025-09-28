import transporter from "./utils/nodemailerTransporter.js";

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: `"MyApp Team" <${process.env.EMAIL_USER}>`,
      to: "prajapatit097@gmail.com", // put your own email here
      subject: "Test Email from Nodemailer",
      text: "Hello! This is a test email from your doctor booking app.",
    });

    console.log("✅ Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

sendTestEmail();
