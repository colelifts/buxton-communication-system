import { config } from "../config.js";
import type { BoardClient, BoardCustomer } from "../types.js";
import { samePhone } from "../utils/phone.js";

interface MondayColumnValue {
  id: string;
  text?: string | null;
  value?: string | null;
}

interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
}

interface MondayItemsPage {
  cursor?: string | null;
  items: MondayItem[];
}

export class MondayClient implements BoardClient {
  private readonly endpoint = "https://api.monday.com/v2";

  async listCustomers(): Promise<BoardCustomer[]> {
    if (!config.MONDAY_API_TOKEN || !config.MONDAY_BOARD_ID) {
      throw new Error("Monday API token and board ID are required when MOCK_BOARD_MODE=false.");
    }

    const firstPageQuery = `
      query ListBoardItems($boardId: [ID!]) {
        boards(ids: $boardId) {
          items_page(limit: 100) {
            cursor
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `;
    const firstPage = await this.request<{ boards: Array<{ items_page: MondayItemsPage }> }>(firstPageQuery, {
      boardId: [config.MONDAY_BOARD_ID]
    });
    const items: MondayItem[] = [...(firstPage.boards[0]?.items_page.items ?? [])];
    let cursor = firstPage.boards[0]?.items_page.cursor;

    const nextPageQuery = `
      query NextBoardItems($cursor: String!) {
        next_items_page(limit: 100, cursor: $cursor) {
          cursor
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    `;

    while (cursor) {
      const nextPage = await this.request<{ next_items_page: MondayItemsPage }>(nextPageQuery, { cursor });
      items.push(...nextPage.next_items_page.items);
      cursor = nextPage.next_items_page.cursor;
    }

    return items.map((item) => this.mapItem(item));
  }

  async findCustomerByPhone(phone: string): Promise<BoardCustomer | undefined> {
    const customers = await this.listCustomers();
    return customers.find((customer) => samePhone(customer.phone, phone));
  }

  async updateCustomer(id: string, fields: Partial<BoardCustomer>): Promise<void> {
    if (!config.MONDAY_BOARD_ID) throw new Error("MONDAY_BOARD_ID is required.");
    const columnValues = this.toMondayColumnValues(fields);
    if (Object.keys(columnValues).length === 0) return;

    const mutation = `
      mutation ChangeColumnValues($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
          id
        }
      }
    `;
    await this.request(mutation, {
      boardId: config.MONDAY_BOARD_ID,
      itemId: id,
      columnValues: JSON.stringify(columnValues)
    });
  }

  async appendSmsLog(id: string, line: string): Promise<void> {
    const customer = (await this.listCustomers()).find((item) => item.id === id);
    const existing = customer?.smsLog ? `${customer.smsLog}\n` : "";
    await this.updateCustomer(id, { smsLog: this.truncateLog(`${existing}${line}`) });
  }

  private async request<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            Authorization: config.MONDAY_API_TOKEN ?? "",
            "API-Version": config.MONDAY_API_VERSION,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
          const body = await response.text();
          if (response.status >= 500 || response.status === 429) {
            throw new Error(`Monday API retryable failure ${response.status}: ${body}`);
          }
          throw new Error(`Monday API request failed with ${response.status}: ${body}`);
        }

        const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
        if (payload.errors?.length) {
          throw new Error(`Monday API error: ${payload.errors.map((error) => error.message).join("; ")}`);
        }
        if (!payload.data) throw new Error("Monday API response did not include data.");
        return payload.data;
      } catch (error) {
        lastError = error;
        if (attempt === 3 || !isRetryableError(error)) break;
        await sleep(250 * attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private mapItem(item: MondayItem): BoardCustomer {
    const valueById = new Map(item.column_values.map((column) => [column.id, column]));
    const text = (id: string): string | undefined => valueById.get(id)?.text ?? undefined;
    const numberValue = (id: string): number | undefined => {
      const parsed = Number(text(id));
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    const checkbox = (id: string): boolean => {
      const value = valueById.get(id)?.value;
      if (!value) return false;
      try {
        const parsed = JSON.parse(value) as { checked?: boolean | string };
        return parsed.checked === true || parsed.checked === "true";
      } catch {
        return false;
      }
    };

    const c = config.mondayColumns;
    return {
      id: item.id,
      name: item.name,
      customerName: text(c.customerName) || item.name,
      phone: text(c.phone),
      email: text(c.email),
      stage: text(c.stage),
      automationPaused: checkbox(c.automationPaused),
      stopAutomation: checkbox(c.stopAutomation),
      lastCustomerReplyAt: text(c.lastCustomerReplyAt),
      lastOutboundSmsAt: text(c.lastOutboundSmsAt),
      lastOutboundTemplate: text(c.lastOutboundTemplate),
      newLeadConfirmedAt: text(c.newLeadConfirmedAt),
      quoteSentAt: text(c.quoteSentAt),
      quoteFollowupStep: numberValue(c.quoteFollowupStep),
      inProgressLastUpdateAt: text(c.inProgressLastUpdateAt),
      appointmentAt: text(c.appointmentAt),
      appointmentReminder24hAt: text(c.appointmentReminder24hAt),
      appointmentReminder2hAt: text(c.appointmentReminder2hAt),
      installCompletedAt: text(c.installCompletedAt),
      afterInstallThankYouAt: text(c.afterInstallThankYouAt),
      reviewRequestSentAt: text(c.reviewRequestSentAt),
      smsLog: text(c.smsLog),
      fields: Object.fromEntries(item.column_values.map((column) => [column.id, column.text ?? column.value]))
    };
  }

  private toMondayColumnValues(fields: Partial<BoardCustomer>): Record<string, unknown> {
    const c = config.mondayColumns;
    const values: Record<string, unknown> = {};
    const setText = (key: keyof BoardCustomer, columnId: string) => {
      const value = fields[key];
      if (value !== undefined) values[columnId] = String(value);
    };
    const setDate = (key: keyof BoardCustomer, columnId: string) => {
      const value = fields[key];
      if (typeof value === "string") values[columnId] = { date: value.slice(0, 10), time: value.slice(11, 19) };
    };
    const setCheckbox = (key: keyof BoardCustomer, columnId: string) => {
      const value = fields[key];
      if (typeof value === "boolean") values[columnId] = { checked: value ? "true" : "false" };
    };

    setText("customerName", c.customerName);
    setText("phone", c.phone);
    setText("email", c.email);
    setText("stage", c.stage);
    setCheckbox("automationPaused", c.automationPaused);
    setCheckbox("stopAutomation", c.stopAutomation);
    setDate("lastCustomerReplyAt", c.lastCustomerReplyAt);
    setDate("lastOutboundSmsAt", c.lastOutboundSmsAt);
    setText("lastOutboundTemplate", c.lastOutboundTemplate);
    setDate("newLeadConfirmedAt", c.newLeadConfirmedAt);
    setDate("quoteSentAt", c.quoteSentAt);
    setText("quoteFollowupStep", c.quoteFollowupStep);
    setDate("inProgressLastUpdateAt", c.inProgressLastUpdateAt);
    setDate("appointmentAt", c.appointmentAt);
    setDate("appointmentReminder24hAt", c.appointmentReminder24hAt);
    setDate("appointmentReminder2hAt", c.appointmentReminder2hAt);
    setDate("installCompletedAt", c.installCompletedAt);
    setDate("afterInstallThankYouAt", c.afterInstallThankYouAt);
    setDate("reviewRequestSentAt", c.reviewRequestSentAt);
    setText("smsLog", c.smsLog);
    return values;
  }

  private truncateLog(value: string): string {
    if (value.length <= config.MONDAY_SMS_LOG_MAX_CHARS) return value;
    return value.slice(value.length - config.MONDAY_SMS_LOG_MAX_CHARS);
  }
}

function isRetryableError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("retryable failure");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
