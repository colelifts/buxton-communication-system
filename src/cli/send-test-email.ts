import { config, validateRuntimeConfig } from "../config.js";
import { createEmailProvider } from "../messaging/email-provider.js";

const to = process.argv[2];
const subject = process.argv[3] || "Buxton Blinds test email";
const text = process.argv.slice(4).join(" ") || "This is a Buxton Blinds email test.";

if (!to) {
  console.error('Usage: npm run email:test -- you@example.com "Subject" "Message"');
  process.exit(1);
}

const errors = validateRuntimeConfig().filter((error) => !error.includes("MONDAY") && !error.includes("Twilio"));
if (errors.length) {
  console.error(`Email configuration error:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

if (!config.TEST_MODE && config.EMAIL_PROVIDER !== "mock" && process.env.CONFIRM_LIVE_EMAIL !== "true") {
  console.error("Refusing to send live email unless CONFIRM_LIVE_EMAIL=true is set.");
  process.exit(1);
}

const provider = createEmailProvider();
const result = await provider.send({
  to,
  subject,
  text,
  html: `<p>${text}</p>`,
  templateKey: "manual_test"
});

console.log(JSON.stringify({ ok: true, result }, null, 2));
