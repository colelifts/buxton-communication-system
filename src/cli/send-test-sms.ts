import { config, validateRuntimeConfig } from "../config.js";
import { createSmsProvider } from "../messaging/sms-provider.js";
import { normalizePhone } from "../utils/phone.js";

const to = normalizePhone(process.argv[2]);
const body = process.argv.slice(3).join(" ") || "Buxton Blinds test message. Please ignore.";

if (!to) {
  console.error("Usage: npm run sms:test -- +15555550100 \"Optional test message\"");
  process.exit(1);
}

const errors = validateRuntimeConfig().filter((error) => !error.includes("MONDAY"));
if (errors.length) {
  console.error(`SMS configuration error:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

if (!config.TEST_MODE && process.env.CONFIRM_LIVE_SMS !== "true") {
  console.error("Refusing to send live SMS unless CONFIRM_LIVE_SMS=true is set.");
  process.exit(1);
}

const sms = createSmsProvider();
const result = await sms.send({
  to,
  body,
  templateKey: "manual_test"
});

console.log(JSON.stringify({ ok: true, result }, null, 2));
