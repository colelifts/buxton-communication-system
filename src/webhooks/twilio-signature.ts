import type { Request } from "express";
import twilio from "twilio";
import { config } from "../config.js";

export function validateTwilioWebhookRequest(req: Request): boolean {
  if (config.TEST_MODE || !config.TWILIO_VALIDATE_WEBHOOKS) return true;
  if (!config.TWILIO_AUTH_TOKEN) {
    throw new Error("TWILIO_AUTH_TOKEN is required to validate Twilio webhooks.");
  }

  const signature = req.header("x-twilio-signature");
  if (!signature) return false;

  const requestUrl = `${config.PUBLIC_BASE_URL}${req.originalUrl}`;
  return twilio.validateRequest(config.TWILIO_AUTH_TOKEN, signature, requestUrl, req.body);
}
