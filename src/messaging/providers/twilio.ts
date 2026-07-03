import twilio from "twilio";
import { config } from "../../config.js";
import type { OutboundMessage, SmsProvider, SmsSendResult } from "../../types.js";

export class TwilioSmsProvider implements SmsProvider {
  name = "twilio";

  async send(message: OutboundMessage): Promise<SmsSendResult> {
    if (!config.TWILIO_ACCOUNT_SID || !config.TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio credentials are missing.");
    }
    if (!config.TWILIO_MESSAGING_SERVICE_SID && !config.FROM_SMS_NUMBER) {
      throw new Error("Set TWILIO_MESSAGING_SERVICE_SID or FROM_SMS_NUMBER.");
    }

    const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      to: message.to,
      body: message.body,
      ...(config.TWILIO_MESSAGING_SERVICE_SID
        ? { messagingServiceSid: config.TWILIO_MESSAGING_SERVICE_SID }
        : { from: config.FROM_SMS_NUMBER })
    });

    return { provider: this.name, messageId: result.sid, testMode: false };
  }
}
