import { config } from "../config.js";
import type { EmailProvider } from "../types.js";
import { MockEmailProvider } from "./providers/mock-email.js";
import { ResendEmailProvider } from "./providers/resend.js";
import { SmtpEmailProvider } from "./providers/smtp.js";

export function createEmailProvider(): EmailProvider {
  if (config.TEST_MODE || config.EMAIL_PROVIDER === "mock") {
    return new MockEmailProvider();
  }

  if (config.EMAIL_PROVIDER === "resend") {
    return new ResendEmailProvider();
  }

  if (config.EMAIL_PROVIDER === "smtp") {
    return new SmtpEmailProvider();
  }

  return new MockEmailProvider();
}
