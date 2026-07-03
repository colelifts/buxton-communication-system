import type { IncomingSms } from "../types.js";
import { normalizePhone } from "../utils/phone.js";

export function parseTwilioWebhook(body: Record<string, unknown>): IncomingSms {
  return {
    provider: "twilio",
    from: normalizePhone(String(body.From ?? "")),
    to: normalizePhone(String(body.To ?? "")),
    body: String(body.Body ?? ""),
    messageId: body.MessageSid ? String(body.MessageSid) : undefined,
    receivedAt: new Date()
  };
}

export function parseFreedomVoiceWebhook(body: Record<string, unknown>): IncomingSms {
  return {
    provider: "freedomvoice",
    from: normalizePhone(String(body.from ?? body.From ?? "")),
    to: normalizePhone(String(body.to ?? body.To ?? "")),
    body: String(body.body ?? body.Body ?? body.message ?? ""),
    messageId: body.id ? String(body.id) : undefined,
    receivedAt: new Date()
  };
}
