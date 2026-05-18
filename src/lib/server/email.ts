import { Resend } from "resend";

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || process.env.RESET_PASSWORD_FROM_EMAIL;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = getFromEmail();

  if (!apiKey || !from) {
    throw new Error("EMAIL_CONFIG_MISSING");
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    text,
  });

  if (error) {
    console.error("[sendEmail] Resend error:", JSON.stringify(error, null, 2));
    throw new Error("EMAIL_SEND_FAILED");
  }

  return {
    success: true,
    id: data?.id,
  };
}
