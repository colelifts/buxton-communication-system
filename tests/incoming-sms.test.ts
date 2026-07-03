import { afterEach, describe, expect, it, vi } from "vitest";
import { handleIncomingSms } from "../src/webhooks/incoming-sms.js";
import type { BoardClient, BoardCustomer, OutboundMessage, SmsProvider, SmsSendResult } from "../src/types.js";

class FakeBoard implements BoardClient {
  public updates: Array<{ id: string; fields: Partial<BoardCustomer> }> = [];
  public logs: Array<{ id: string; line: string }> = [];

  constructor(private readonly customers: BoardCustomer[]) {}

  async listCustomers(): Promise<BoardCustomer[]> {
    return this.customers;
  }

  async findCustomerByPhone(phone: string): Promise<BoardCustomer | undefined> {
    return this.customers.find((customer) => customer.phone === phone);
  }

  async updateCustomer(id: string, fields: Partial<BoardCustomer>): Promise<void> {
    this.updates.push({ id, fields });
  }

  async appendSmsLog(id: string, line: string): Promise<void> {
    this.logs.push({ id, line });
  }
}

class FakeSms implements SmsProvider {
  name = "fake";
  public sent: OutboundMessage[] = [];

  async send(message: OutboundMessage): Promise<SmsSendResult> {
    this.sent.push(message);
    return { provider: this.name, messageId: "fake-message", testMode: true };
  }
}

describe("handleIncomingSms", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pauses automation and logs a matched customer reply", async () => {
    const customer: BoardCustomer = {
      id: "item-1",
      name: "Jane Sample",
      phone: "+15555550100",
      fields: {}
    };
    const board = new FakeBoard([customer]);
    const sms = new FakeSms();

    await handleIncomingSms(board, sms, {
      provider: "twilio",
      from: "+15555550100",
      to: "+15555550999",
      body: "Please call me",
      messageId: "SM123",
      receivedAt: new Date("2026-07-02T17:00:00.000Z")
    });

    expect(board.updates).toEqual([
      {
        id: "item-1",
        fields: {
          automationPaused: true,
          lastCustomerReplyAt: "2026-07-02T17:00:00.000Z"
        }
      }
    ]);
    expect(board.logs[0]?.line).toContain("IN twilio: Please call me");
  });

  it("does not update the board for unmatched replies", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const board = new FakeBoard([]);
    const sms = new FakeSms();

    await handleIncomingSms(board, sms, {
      provider: "twilio",
      from: "+15555550199",
      body: "Wrong number",
      receivedAt: new Date("2026-07-02T17:00:00.000Z")
    });

    expect(board.updates).toHaveLength(0);
    expect(board.logs).toHaveLength(0);
  });
});
