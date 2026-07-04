import "dotenv/config";
import { config } from "../config.js";

if (!config.RESEND_API_KEY) {
  console.error("RESEND_API_KEY is missing.");
  process.exit(1);
}

const response = await fetch("https://api.resend.com/domains", {
  headers: {
    Authorization: `Bearer ${config.RESEND_API_KEY}`,
    Accept: "application/json"
  }
});

const payload = (await response.json()) as unknown;
if (!response.ok) {
  console.error(JSON.stringify({ ok: false, status: response.status, payload }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, domains: payload }, null, 2));
