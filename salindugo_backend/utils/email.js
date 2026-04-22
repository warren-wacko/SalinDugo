import { BrevoClient, BrevoEnvironment } from "@getbrevo/brevo";

const client = new BrevoClient({
  apiKey: process.env.BREVO_MAIL,
  environment: BrevoEnvironment.Production,
});

export const sendEmail = async (to, subject, text) => {
  try {
    const result = await client.transactionalEmails.sendTransacEmail({
      sender: { name: "SalinDugo", email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      textContent: text,
    });

    console.log("Email sent:", result.messageId);
    return result;
  } catch (err) {
    console.error("FULL EMAIL ERROR:", err);
    throw err;
  }
};

export default sendEmail;
