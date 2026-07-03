import { config } from "../../config.js";
import type { OutboundMessage, SmsProvider, SmsSendResult } from "../../types.js";

export class FreedomVoiceSmsProvider implements SmsProvider {
  name = "freedomvoice";

  async send(_message: OutboundMessage): Promise<SmsSendResult> {
    if (!config.FREEDOMVOICE_API_KEY || !config.FREEDOMVOICE_API_BASE_URL) {
      throw new Error("FreedomVoice API settings are missing.");
    }

    throw new Error(
      "FreedomVoice SMS automation is not implemented yet. Confirm FreedomVoice supports outbound API SMS and inbound webhooks before enabling this provider."
    );
  }
}
