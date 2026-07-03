import { config } from "../config.js";
import { renderTemplate, type TemplateKey } from "../messaging/templates.js";
import type { BoardClient, BoardCustomer, SmsProvider } from "../types.js";
import { daysSince, hasDate, hoursUntil, nowIso } from "../utils/dates.js";
import { normalizePhone } from "../utils/phone.js";
import { log } from "../logger.js";

export interface SchedulerSummary {
  scanned: number;
  sent: number;
  skipped: number;
  sendLimitReached: boolean;
  errors: Array<{ customerId: string; message: string }>;
}

interface SendPlan {
  templateKey: TemplateKey;
  updates: Partial<BoardCustomer>;
}

export async function runScheduler(board: BoardClient, sms: SmsProvider, now = new Date()): Promise<SchedulerSummary> {
  const customers = await board.listCustomers();
  const summary: SchedulerSummary = {
    scanned: customers.length,
    sent: 0,
    skipped: 0,
    sendLimitReached: false,
    errors: []
  };

  for (const customer of customers) {
    if (summary.sent >= config.MAX_SMS_PER_SCHEDULER_RUN) {
      summary.sendLimitReached = true;
      break;
    }

    try {
      const plans = buildPlans(customer, now);
      if (plans.length === 0) {
        summary.skipped += 1;
        continue;
      }

      for (const plan of plans) {
        if (summary.sent >= config.MAX_SMS_PER_SCHEDULER_RUN) {
          summary.sendLimitReached = true;
          break;
        }
        await sendPlannedMessage(board, sms, customer, plan, now);
        summary.sent += 1;
      }
    } catch (error) {
      summary.errors.push({
        customerId: customer.id,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return summary;
}

export function buildPlans(customer: BoardCustomer, now = new Date()): SendPlan[] {
  if (!canAutomate(customer)) return [];

  const plans: SendPlan[] = [];
  const stamp = nowIso(now);

  if (customer.stage === "New Lead" && !hasDate(customer.newLeadConfirmedAt)) {
    plans.push({ templateKey: "new_lead_confirmation", updates: { newLeadConfirmedAt: stamp } });
  }

  if (customer.stage === "Quote Sent" && hasDate(customer.quoteSentAt)) {
    const sentDaysAgo = daysSince(customer.quoteSentAt, now);
    const currentStep = customer.quoteFollowupStep ?? 0;
    if (sentDaysAgo >= 2 && currentStep < 1) {
      plans.push({ templateKey: "quote_followup_1", updates: { quoteFollowupStep: 1 } });
    } else if (sentDaysAgo >= 5 && currentStep < 2) {
      plans.push({ templateKey: "quote_followup_2", updates: { quoteFollowupStep: 2 } });
    } else if (sentDaysAgo >= 10 && currentStep < 3) {
      plans.push({ templateKey: "quote_followup_3", updates: { quoteFollowupStep: 3 } });
    }
  }

  if (customer.stage === "In Progress" && daysSince(customer.inProgressLastUpdateAt, now) >= 7) {
    plans.push({ templateKey: "weekly_in_progress", updates: { inProgressLastUpdateAt: stamp } });
  }

  if (customer.stage === "Appointment Scheduled" && hasDate(customer.appointmentAt)) {
    const appointmentHours = hoursUntil(customer.appointmentAt, now);
    if (appointmentHours <= 24 && appointmentHours > 2 && !hasDate(customer.appointmentReminder24hAt)) {
      plans.push({ templateKey: "appointment_reminder_24h", updates: { appointmentReminder24hAt: stamp } });
    }
    if (appointmentHours <= 2 && appointmentHours > 0 && !hasDate(customer.appointmentReminder2hAt)) {
      plans.push({ templateKey: "appointment_reminder_2h", updates: { appointmentReminder2hAt: stamp } });
    }
  }

  if ((customer.stage === "Installed" || customer.stage === "Closed Won") && hasDate(customer.installCompletedAt)) {
    if (!hasDate(customer.afterInstallThankYouAt)) {
      plans.push({ templateKey: "after_install_thank_you", updates: { afterInstallThankYouAt: stamp } });
    } else if (daysSince(customer.installCompletedAt, now) >= 2 && !hasDate(customer.reviewRequestSentAt)) {
      plans.push({ templateKey: "google_review_request", updates: { reviewRequestSentAt: stamp } });
    }
  }

  return plans.slice(0, 1);
}

function canAutomate(customer: BoardCustomer): boolean {
  return Boolean(customer.phone) && !customer.automationPaused && !customer.stopAutomation;
}

async function sendPlannedMessage(
  board: BoardClient,
  sms: SmsProvider,
  customer: BoardCustomer,
  plan: SendPlan,
  now: Date
): Promise<void> {
  const to = normalizePhone(customer.phone);
  if (!to) throw new Error("Customer does not have a valid SMS phone number.");

  const body = renderTemplate(plan.templateKey, customer);
  const message = { to, body, templateKey: plan.templateKey, customerId: customer.id };

  if (config.TEST_MODE) {
    log("info", "test_mode_sms_send", { to, templateKey: plan.templateKey, customerId: customer.id });
  }

  await sms.send(message);
  await board.appendSmsLog(customer.id, `[${nowIso(now)}] OUT ${plan.templateKey}: ${body}`);
  await board.updateCustomer(customer.id, {
    ...plan.updates,
    lastOutboundSmsAt: nowIso(now),
    lastOutboundTemplate: plan.templateKey
  });
}
