import type { OutboundMessage, SmsProvider, SmsSendResult } from "../../types.js";
import { log } from "../../logger.js";

export class MockSmsProvider implements SmsProvider {
  name = "mock";

  async send(message: OutboundMessage): Promise<SmsSendResult> {
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    log("info", "mock_sms_send", {
      to: message.to,
      templateKey: message.templateKey,
      body: message.body
    });
    return { provider: this.name, messageId, testMode: true };
  }
}
