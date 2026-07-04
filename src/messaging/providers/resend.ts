import { config } from "../../config.js";
import type { EmailProvider, EmailSendResult, OutboundEmail } from "../../types.js";

export class ResendEmailProvider implements EmailProvider {
  name = "resend";

  async send(message: OutboundEmail): Promise<EmailSendResult> {
    if (!config.RESEND_API_KEY) throw new Error("RESEND_API_KEY is missing.");
    if (!config.EMAIL_FROM_ADDRESS) throw new Error("EMAIL_FROM_ADDRESS is missing.");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: `${config.EMAIL_FROM_NAME} <${config.EMAIL_FROM_ADDRESS}>`,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html
      })
    });

    const payload = (await response.json()) as { id?: string; message?: string };
    if (!response.ok) {
      throw new Error(`Resend email failed: ${payload.message ?? response.statusText}`);
    }

    return { provider: this.name, messageId: payload.id ?? "resend_unknown", testMode: false };
  }
}
