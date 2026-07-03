import "dotenv/config";
import { z } from "zod";

const boolFromString = z
  .string()
  .optional()
  .transform((value) => value?.toLowerCase() === "true");

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  PUBLIC_BASE_URL: z.string().default("http://localhost:3000"),
  TEST_MODE: boolFromString.default("true"),
  MOCK_BOARD_MODE: boolFromString.default("true"),
  MOCK_BOARD_DATA_PATH: z.string().default("./mock-data.local.json"),
  SCHEDULER_SECRET: z.string().default("change-me-for-deployed-cron"),
  MAX_SMS_PER_SCHEDULER_RUN: z.coerce.number().int().positive().default(25),
  MONDAY_SMS_LOG_MAX_CHARS: z.coerce.number().int().positive().default(12000),
  MONDAY_API_TOKEN: z.string().optional(),
  MONDAY_BOARD_ID: z.string().optional(),
  MONDAY_API_VERSION: z.string().default("2024-10"),
  SMS_PROVIDER: z.enum(["twilio", "freedomvoice", "mock"]).default("mock"),
  FROM_SMS_NUMBER: z.string().optional(),
  INTERNAL_NOTIFICATION_NUMBER: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_VALIDATE_WEBHOOKS: boolFromString.default("true"),
  FREEDOMVOICE_API_KEY: z.string().optional(),
  FREEDOMVOICE_API_BASE_URL: z.string().optional(),
  GOOGLE_REVIEW_URL: z.string().default("https://g.page/r/your-review-link"),
  BUXTON_OFFICE_PHONE: z.string().optional()
});

const env = envSchema.parse(process.env);

export const config = {
  ...env,
  mondayColumns: {
    customerName: process.env.MONDAY_COL_CUSTOMER_NAME ?? "customer_name",
    phone: process.env.MONDAY_COL_PHONE ?? "phone",
    email: process.env.MONDAY_COL_EMAIL ?? "email",
    stage: process.env.MONDAY_COL_STAGE ?? "stage",
    status: process.env.MONDAY_COL_STATUS ?? "status",
    automationPaused: process.env.MONDAY_COL_AUTOMATION_PAUSED ?? "automation_paused",
    stopAutomation: process.env.MONDAY_COL_STOP_AUTOMATION ?? "stop_automation",
    lastCustomerReplyAt: process.env.MONDAY_COL_LAST_CUSTOMER_REPLY_AT ?? "last_customer_reply_at",
    lastOutboundSmsAt: process.env.MONDAY_COL_LAST_OUTBOUND_SMS_AT ?? "last_outbound_sms_at",
    lastOutboundTemplate: process.env.MONDAY_COL_LAST_OUTBOUND_TEMPLATE ?? "last_outbound_template",
    newLeadConfirmedAt: process.env.MONDAY_COL_NEW_LEAD_CONFIRMED_AT ?? "new_lead_confirmed_at",
    quoteSentAt: process.env.MONDAY_COL_QUOTE_SENT_AT ?? "quote_sent_at",
    quoteFollowupStep: process.env.MONDAY_COL_QUOTE_FOLLOWUP_STEP ?? "quote_followup_step",
    inProgressLastUpdateAt: process.env.MONDAY_COL_IN_PROGRESS_LAST_UPDATE_AT ?? "in_progress_last_update_at",
    appointmentAt: process.env.MONDAY_COL_APPOINTMENT_AT ?? "appointment_at",
    appointmentReminder24hAt: process.env.MONDAY_COL_APPOINTMENT_REMINDER_24H_AT ?? "appointment_reminder_24h_at",
    appointmentReminder2hAt: process.env.MONDAY_COL_APPOINTMENT_REMINDER_2H_AT ?? "appointment_reminder_2h_at",
    installCompletedAt: process.env.MONDAY_COL_INSTALL_COMPLETED_AT ?? "install_completed_at",
    afterInstallThankYouAt: process.env.MONDAY_COL_AFTER_INSTALL_THANK_YOU_AT ?? "after_install_thank_you_at",
    reviewRequestSentAt: process.env.MONDAY_COL_REVIEW_REQUEST_SENT_AT ?? "review_request_sent_at",
    smsLog: process.env.MONDAY_COL_SMS_LOG ?? "sms_log"
  }
};

export type AppConfig = typeof config;

export function validateRuntimeConfig(): string[] {
  const errors: string[] = [];

  if (!config.TEST_MODE && config.SCHEDULER_SECRET === "change-me-for-deployed-cron") {
    errors.push("Set a strong SCHEDULER_SECRET before running with TEST_MODE=false.");
  }

  if (!config.MOCK_BOARD_MODE) {
    if (!config.MONDAY_API_TOKEN) errors.push("MONDAY_API_TOKEN is required when MOCK_BOARD_MODE=false.");
    if (!config.MONDAY_BOARD_ID) errors.push("MONDAY_BOARD_ID is required when MOCK_BOARD_MODE=false.");
  }

  if (!config.TEST_MODE && config.SMS_PROVIDER === "mock") {
    errors.push("SMS_PROVIDER cannot be mock when TEST_MODE=false.");
  }

  if (!config.TEST_MODE && config.SMS_PROVIDER === "twilio") {
    if (!config.TWILIO_ACCOUNT_SID) errors.push("TWILIO_ACCOUNT_SID is required for Twilio.");
    if (!config.TWILIO_AUTH_TOKEN) errors.push("TWILIO_AUTH_TOKEN is required for Twilio.");
    if (!config.TWILIO_MESSAGING_SERVICE_SID && !config.FROM_SMS_NUMBER) {
      errors.push("Set TWILIO_MESSAGING_SERVICE_SID or FROM_SMS_NUMBER for Twilio.");
    }
  }

  if (!config.TEST_MODE && config.SMS_PROVIDER === "freedomvoice") {
    errors.push("FreedomVoice provider is not production-ready yet. Use Twilio until its API/webhooks are confirmed.");
  }

  return errors;
}
