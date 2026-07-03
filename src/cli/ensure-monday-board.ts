import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { config } from "../config.js";

interface MondayColumn {
  id: string;
  title: string;
  type: string;
}

interface RequiredColumn {
  envKey: string;
  title: string;
  type: string;
}

const requiredColumns: RequiredColumn[] = [
  { envKey: "MONDAY_COL_STAGE", title: "Automation Stage", type: "status" },
  { envKey: "MONDAY_COL_AUTOMATION_PAUSED", title: "Automation Paused", type: "checkbox" },
  { envKey: "MONDAY_COL_STOP_AUTOMATION", title: "Stop Automation", type: "checkbox" },
  { envKey: "MONDAY_COL_LAST_CUSTOMER_REPLY_AT", title: "Last Customer Reply At", type: "date" },
  { envKey: "MONDAY_COL_LAST_OUTBOUND_SMS_AT", title: "Last Outbound SMS At", type: "date" },
  { envKey: "MONDAY_COL_LAST_OUTBOUND_TEMPLATE", title: "Last Outbound Template", type: "text" },
  { envKey: "MONDAY_COL_NEW_LEAD_CONFIRMED_AT", title: "New Lead Confirmed At", type: "date" },
  { envKey: "MONDAY_COL_QUOTE_SENT_AT", title: "Quote Sent At", type: "date" },
  { envKey: "MONDAY_COL_QUOTE_FOLLOWUP_STEP", title: "Quote Follow-up Step", type: "numbers" },
  { envKey: "MONDAY_COL_IN_PROGRESS_LAST_UPDATE_AT", title: "In Progress Last Update At", type: "date" },
  { envKey: "MONDAY_COL_APPOINTMENT_REMINDER_24H_AT", title: "Appointment Reminder 24h At", type: "date" },
  { envKey: "MONDAY_COL_APPOINTMENT_REMINDER_2H_AT", title: "Appointment Reminder 2h At", type: "date" },
  { envKey: "MONDAY_COL_INSTALL_COMPLETED_AT", title: "Install Completed At", type: "date" },
  { envKey: "MONDAY_COL_AFTER_INSTALL_THANK_YOU_AT", title: "After Install Thank You At", type: "date" },
  { envKey: "MONDAY_COL_REVIEW_REQUEST_SENT_AT", title: "Review Request Sent At", type: "date" },
  { envKey: "MONDAY_COL_SMS_LOG", title: "SMS Log", type: "long_text" }
];

const existingMappings: RequiredColumn[] = [
  { envKey: "MONDAY_COL_CUSTOMER_NAME", title: "Customer Name", type: "text" },
  { envKey: "MONDAY_COL_PHONE", title: "Phone", type: "phone" },
  { envKey: "MONDAY_COL_EMAIL", title: "Email", type: "email" },
  { envKey: "MONDAY_COL_STATUS", title: "Order Status", type: "status" },
  { envKey: "MONDAY_COL_APPOINTMENT_AT", title: "Install Date", type: "date" }
];

if (!process.env.MONDAY_API_TOKEN || !config.MONDAY_BOARD_ID) {
  console.error("MONDAY_API_TOKEN and MONDAY_BOARD_ID are required.");
  process.exit(1);
}

const board = await getBoard();
const columnsByTitle = new Map(board.columns.map((column) => [normalize(column.title), column]));
const envUpdates: Record<string, string> = {};

for (const mapping of existingMappings) {
  const column = columnsByTitle.get(normalize(mapping.title));
  if (column) envUpdates[mapping.envKey] = column.id;
}

for (const required of requiredColumns) {
  const existing = columnsByTitle.get(normalize(required.title));
  if (existing) {
    envUpdates[required.envKey] = existing.id;
    continue;
  }

  const created = await createColumn(required.title, required.type);
  columnsByTitle.set(normalize(created.title), created);
  envUpdates[required.envKey] = created.id;
  console.log(`Created Monday column: ${created.title} (${created.id})`);
}

updateEnvFile(envUpdates);
console.log(`Monday board ready: ${board.name}`);
console.log(`Updated ${Object.keys(envUpdates).length} column mappings in .env.`);

async function getBoard(): Promise<{ id: string; name: string; columns: MondayColumn[] }> {
  const query = `query ($boardId: [ID!]) { boards(ids: $boardId) { id name columns { id title type } } }`;
  const data = await mondayRequest<{ boards: Array<{ id: string; name: string; columns: MondayColumn[] }> }>(query, {
    boardId: [config.MONDAY_BOARD_ID]
  });
  const board = data.boards[0];
  if (!board) throw new Error(`Monday board not found: ${config.MONDAY_BOARD_ID}`);
  return board;
}

async function createColumn(title: string, type: string): Promise<MondayColumn> {
  const mutation = `
    mutation ($boardId: ID!, $title: String!, $type: ColumnType!) {
      create_column(board_id: $boardId, title: $title, column_type: $type) {
        id
        title
        type
      }
    }
  `;
  const data = await mondayRequest<{ create_column: MondayColumn }>(mutation, {
    boardId: config.MONDAY_BOARD_ID,
    title,
    type
  });
  return data.create_column;
}

async function mondayRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      Authorization: process.env.MONDAY_API_TOKEN ?? "",
      "API-Version": process.env.MONDAY_API_VERSION || "2024-10",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });
  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new Error(`Monday API error: ${JSON.stringify(payload.errors ?? payload)}`);
  }
  return payload.data;
}

function updateEnvFile(updates: Record<string, string>): void {
  const envPath = path.resolve(process.cwd(), ".env");
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    if (new RegExp(`^${key}=.*$`, "m").test(content)) {
      content = content.replace(new RegExp(`^${key}=.*$`, "m"), line);
    } else {
      content = `${content.trimEnd()}\n${line}\n`;
    }
  }

  fs.writeFileSync(envPath, content);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
