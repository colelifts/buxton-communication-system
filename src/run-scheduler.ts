import { runScheduler } from "./automation/scheduler.js";
import { validateRuntimeConfig } from "./config.js";
import { createSmsProvider } from "./messaging/sms-provider.js";
import { createBoardClient } from "./monday/board-client.js";

const configErrors = validateRuntimeConfig();
if (configErrors.length) {
  console.error(`Configuration error:\n- ${configErrors.join("\n- ")}`);
  process.exit(1);
}

const summary = await runScheduler(createBoardClient(), createSmsProvider());
console.log(JSON.stringify(summary, null, 2));
