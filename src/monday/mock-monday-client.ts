import fs from "node:fs/promises";
import path from "node:path";
import type { BoardClient, BoardCustomer } from "../types.js";
import { samePhone } from "../utils/phone.js";
import { config } from "../config.js";
import { log } from "../logger.js";

export class MockMondayClient implements BoardClient {
  constructor(private readonly dataPath: string) {}

  async listCustomers(): Promise<BoardCustomer[]> {
    const absolutePath = await this.ensureDataFile();
    const raw = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(raw) as BoardCustomer[];
  }

  async findCustomerByPhone(phone: string): Promise<BoardCustomer | undefined> {
    const customers = await this.listCustomers();
    return customers.find((customer) => samePhone(customer.phone, phone));
  }

  async updateCustomer(id: string, fields: Partial<BoardCustomer>): Promise<void> {
    const customers = await this.listCustomers();
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) throw new Error(`Mock Monday item not found: ${id}`);

    customers[index] = {
      ...customers[index],
      ...fields,
      fields: {
        ...customers[index].fields,
        ...fields
      }
    };

    await this.writeCustomers(customers);
    log("info", "mock_monday_update", { itemId: id, fields });
  }

  async appendSmsLog(id: string, line: string): Promise<void> {
    const customers = await this.listCustomers();
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) throw new Error(`Mock Monday item not found: ${id}`);

    const existing = customers[index].smsLog ? `${customers[index].smsLog}\n` : "";
    customers[index] = {
      ...customers[index],
      smsLog: truncateLog(`${existing}${line}`)
    };

    await this.writeCustomers(customers);
    log("info", "mock_monday_append_sms_log", { itemId: id, line });
  }

  private async ensureDataFile(): Promise<string> {
    const absolutePath = path.resolve(process.cwd(), this.dataPath);
    try {
      await fs.access(absolutePath);
      return absolutePath;
    } catch {
      const examplePath = path.resolve(process.cwd(), "mock-data.example.json");
      const example = await fs.readFile(examplePath, "utf8");
      await fs.writeFile(absolutePath, example);
      return absolutePath;
    }
  }

  private async writeCustomers(customers: BoardCustomer[]): Promise<void> {
    const absolutePath = await this.ensureDataFile();
    await fs.writeFile(absolutePath, `${JSON.stringify(customers, null, 2)}\n`);
  }
}

function truncateLog(value: string): string {
  if (value.length <= config.MONDAY_SMS_LOG_MAX_CHARS) return value;
  return value.slice(value.length - config.MONDAY_SMS_LOG_MAX_CHARS);
}
