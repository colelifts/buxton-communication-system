import { log } from "../logger.js";

export function handleTwilioStatusWebhook(body: Record<string, unknown>): void {
  log("info", "twilio_status_callback", {
    messageSid: body.MessageSid,
    messageStatus: body.MessageStatus,
    errorCode: body.ErrorCode,
    errorMessage: body.ErrorMessage,
    to: body.To
  });
}
