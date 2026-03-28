// Email sending service — wraps Resend.
// Exports a single sendEmail({ to, subject, html, text }) function
// for use by any backend module (e.g. renewal-job.js).
// Requires RESEND_API_KEY in the environment.

import { Resend } from "resend";

// Sends a single email. Throws on delivery failure.
// - to:      recipient address (string)
// - subject: email subject line
// - html:    HTML body (required)
// - text:    plain-text fallback (optional but recommended)
export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email service not configured: RESEND_API_KEY missing");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@workplacecomplianceinstitute.com",
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend delivery failed: ${error.message}`);
  }
}
