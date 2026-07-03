import type { SmsProvider } from "../types.js";
import { config } from "../config.js";
import { MockSmsProvider } from "./providers/mock.js";
import { TwilioSmsProvider } from "./providers/twilio.js";
import { FreedomVoiceSmsProvider } from "./providers/freedomvoice.js";

export function createSmsProvider(): SmsProvider {
  if (config.TEST_MODE || config.SMS_PROVIDER === "mock") {
    return new MockSmsProvider();
  }

  if (config.SMS_PROVIDER === "twilio") {
    return new TwilioSmsProvider();
  }

  if (config.SMS_PROVIDER === "freedomvoice") {
    return new FreedomVoiceSmsProvider();
  }

  return new MockSmsProvider();
}
