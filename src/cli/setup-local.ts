import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), ".env");
const source = path.resolve(process.cwd(), "env/.env.local.example");

if (fs.existsSync(target)) {
  console.log(".env already exists. Leaving it unchanged.");
  process.exit(0);
}

fs.copyFileSync(source, target);
console.log("Created .env from env/.env.local.example.");
console.log("Local mode is safe: TEST_MODE=true, MOCK_BOARD_MODE=true, SMS_PROVIDER=mock.");
