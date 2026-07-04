import { config } from "../../config.js";
import type { EmailProvider, EmailSendResult, OutboundEmail } from "../../types.js";

export class BrevoEmailProvider implements EmailProvider {
  name = "brevo";

  async send(message: OutboundEmail): Promise<EmailSendResult> {
    if (!config.BREVO_API_KEY) throw new Error("BREVO_API_KEY is missing.");
    if (!config.EMAIL_FROM_ADDRESS) throw new Error("EMAIL_FROM_ADDRESS is missing.");

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        sender: {
          email: config.EMAIL_FROM_ADDRESS,
          name: config.EMAIL_FROM_NAME
        },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html
      })
    });

    const payload = (await response.json()) as { messageId?: string; message?: string; code?: string };
    if (!response.ok) {
      throw new Error(`Brevo email failed: ${payload.message ?? payload.code ?? response.statusText}`);
    }

    return { provider: this.name, messageId: payload.messageId ?? "brevo_unknown", testMode: false };
  }
}
