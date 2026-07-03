import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPlans, runScheduler } from "../src/automation/scheduler.js";
import { config } from "../src/config.js";
import type { BoardClient, BoardCustomer, OutboundMessage, SmsProvider, SmsSendResult } from "../src/types.js";

function customer(overrides: Partial<BoardCustomer>): BoardCustomer {
  return {
    id: "1",
    name: "Test Customer",
    phone: "+15555550100",
    fields: {},
    ...overrides
  };
}

describe("buildPlans", () => {
  const now = new Date("2026-07-02T17:00:00.000Z");

  it("sends new lead confirmation once", () => {
    expect(buildPlans(customer({ stage: "New Lead" }), now)[0]?.templateKey).toBe("new_lead_confirmation");
    expect(buildPlans(customer({ stage: "New Lead", newLeadConfirmedAt: now.toISOString() }), now)).toHaveLength(0);
  });

  it("does not automate paused customers", () => {
    expect(buildPlans(customer({ stage: "New Lead", automationPaused: true }), now)).toHaveLength(0);
    expect(buildPlans(customer({ stage: "New Lead", stopAutomation: true }), now)).toHaveLength(0);
  });

  it("selects the next quote follow-up step", () => {
    const quoteSentAt = "2026-06-27T17:00:00.000Z";
    expect(buildPlans(customer({ stage: "Quote Sent", quoteSentAt, quoteFollowupStep: 1 }), now)[0]?.templateKey).toBe(
      "quote_followup_2"
    );
  });

  it("sends appointment reminders within their windows", () => {
    const appointmentAt = "2026-07-03T16:00:00.000Z";
    expect(buildPlans(customer({ stage: "Appointment Scheduled", appointmentAt }), now)[0]?.templateKey).toBe(
      "appointment_reminder_24h"
    );
  });

  it("sends review request after the install thank-you has already been sent", () => {
    expect(
      buildPlans(
        customer({
          stage: "Installed",
          installCompletedAt: "2026-06-29T17:00:00.000Z",
          afterInstallThankYouAt: "2026-06-29T18:00:00.000Z"
        }),
        now
      )[0]?.templateKey
    ).toBe("google_review_request");
  });
});

describe("runScheduler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("respects the max sends per scheduler run", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    const previousLimit = config.MAX_SMS_PER_SCHEDULER_RUN;
    config.MAX_SMS_PER_SCHEDULER_RUN = 1;

    const board: BoardClient = {
      listCustomers: async () => [
        customer({ id: "1", stage: "New Lead" }),
        customer({ id: "2", stage: "New Lead" })
      ],
      findCustomerByPhone: async () => undefined,
      updateCustomer: async () => undefined,
      appendSmsLog: async () => undefined
    };
    const sent: OutboundMessage[] = [];
    const sms: SmsProvider = {
      name: "test",
      send: async (message): Promise<SmsSendResult> => {
        sent.push(message);
        return { provider: "test", messageId: "test-id", testMode: true };
      }
    };

    try {
      const summary = await runScheduler(board, sms, new Date("2026-07-02T17:00:00.000Z"));
      expect(summary.sent).toBe(1);
      expect(summary.sendLimitReached).toBe(true);
      expect(sent).toHaveLength(1);
    } finally {
      config.MAX_SMS_PER_SCHEDULER_RUN = previousLimit;
    }
  });
});
