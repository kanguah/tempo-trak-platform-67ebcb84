import nodemailer from "nodemailer";

interface SendMailProps {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

export async function sendMail({ to, subject, html }: SendMailProps) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Mail Error:", error);
    return { success: false, error: error.message || "Mail sending failed" };
  }
}
