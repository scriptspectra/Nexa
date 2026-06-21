/**
 * Email utilities using Resend.
 *
 * Set RESEND_API_KEY in your Convex environment variables.
 * Optionally set RESEND_FROM_EMAIL (defaults to "Zephyra <noreply@zephyra.app>").
 *
 * If the key is not set, sending is skipped with a console.warn so the app
 * continues to work in development without email credentials.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a transactional email via Resend.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email send");
    return false;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "Zephyra <noreply@zephyra.app>";

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`RESEND_ERROR: ${res.status} — ${body}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("RESEND_SEND_ERROR:", err);
    return false;
  }
}

/**
 * Send the standard escalation notification email to a contact.
 */
export async function sendEscalationEmail({
  contactEmail,
  contactName,
  organizationName,
  conversationId,
  dashboardUrl,
}: {
  contactEmail: string;
  contactName: string;
  organizationName: string;
  conversationId: string;
  dashboardUrl?: string;
}): Promise<boolean> {
  const subject = `Your support request has been escalated — ${organizationName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0a; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #111; border: 1px solid #333; border-radius: 4px; overflow: hidden; }
    .header { background: #000; border-bottom: 1px solid #333; padding: 24px 32px; }
    .header h1 { color: #fff; font-size: 18px; font-weight: 700; margin: 0; letter-spacing: 0.05em; text-transform: uppercase; }
    .body { padding: 32px; }
    .body p { color: #ccc; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
    .badge { display: inline-block; background: #1a1a2e; border: 1px solid #f59e0b; color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 2px; margin-bottom: 20px; }
    .footer { padding: 16px 32px; border-top: 1px solid #333; }
    .footer p { color: #555; font-size: 11px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Zephyra · ${organizationName}</h1>
    </div>
    <div class="body">
      <div class="badge">Escalated</div>
      <p>Hi ${contactName},</p>
      <p>Your support conversation has been escalated to a human agent. A member of our team will be in touch with you shortly.</p>
      <p>You don't need to do anything — we'll follow up via this email address.</p>
      <p>Thank you for your patience.</p>
    </div>
    <div class="footer">
      <p>Conversation ID: ${conversationId}</p>
      <p>Powered by Zephyra Enterprise</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: contactEmail,
    subject,
    html,
  });
}
