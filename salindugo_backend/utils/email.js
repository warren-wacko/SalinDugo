import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, text) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "SalinDugo <onboarding@resend.dev>", // use this until you add a domain
      to,
      subject,
      text,
    });

    if (error) {
      console.error("FULL EMAIL ERROR:", error);
      throw new Error(error.message);
    }

    console.log("Email sent:", data.id);
    return data;
  } catch (err) {
    console.error("FULL EMAIL ERROR:", err);
    throw err;
  }
};

export default sendEmail;
