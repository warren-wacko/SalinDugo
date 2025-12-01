import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a reusable transporter object using SMTP or other transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com", // e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT || 587, // 465 for SSL, 587 for TLS
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// sendEmail helper
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: `<${process.env.EMAIL_USER}>`, // sender address
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("Email sending error:", err);
    throw new Error("Failed to send email");
  }
};

export default sendEmail;
