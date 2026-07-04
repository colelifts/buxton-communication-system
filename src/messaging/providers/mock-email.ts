import { log } from "../../logger.js";
import type { EmailProvider, EmailSendResult, OutboundEmail } from "../../types.js";

export class MockEmailProvider implements EmailProvider {
  name = "mock";

  async send(message: OutboundEmail): Promise<EmailSendResult> {
    const messageId = `mock_email_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    log("info", "mock_email_send", {
      to: message.to,
      subject: message.subject,
      templateKey: message.templateKey
    });
    return { provider: this.name, messageId, testMode: true };
  }
}
