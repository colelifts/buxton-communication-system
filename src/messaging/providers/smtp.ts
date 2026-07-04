import nodemailer from "nodemailer";
import { config } from "../../config.js";
import type { EmailProvider, EmailSendResult, OutboundEmail } from "../../types.js";

export class SmtpEmailProvider implements EmailProvider {
  name = "smtp";

  async send(message: OutboundEmail): Promise<EmailSendResult> {
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
      throw new Error("SMTP settings are missing.");
    }
    if (!config.EMAIL_FROM_ADDRESS) throw new Error("EMAIL_FROM_ADDRESS is missing.");

    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });

    const result = await transporter.sendMail({
      from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_ADDRESS}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    });

    return { provider: this.name, messageId: result.messageId, testMode: false };
  }
}
