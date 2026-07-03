import { config, validateRuntimeConfig } from "../config.js";
import { createBoardClient } from "../monday/board-client.js";

const configErrors = validateRuntimeConfig();
const mondayRelevantErrors = configErrors.filter((error) => error.includes("MONDAY"));

if (mondayRelevantErrors.length) {
  console.error(`Monday configuration error:\n- ${mondayRelevantErrors.join("\n- ")}`);
  process.exit(1);
}

const board = createBoardClient();
const customers = await board.listCustomers();
const columns = Object.entries(config.mondayColumns).map(([key, columnId]) => ({ key, columnId }));

console.log(
  JSON.stringify(
    {
      ok: true,
      mockBoardMode: config.MOCK_BOARD_MODE,
      customerCount: customers.length,
      sampleCustomers: customers.slice(0, 5).map((customer) => ({
        id: customer.id,
        name: customer.name,
        phonePresent: Boolean(customer.phone),
        stage: customer.stage,
        automationPaused: customer.automationPaused,
        stopAutomation: customer.stopAutomation
      })),
      configuredColumns: columns
    },
    null,
    2
  )
);
