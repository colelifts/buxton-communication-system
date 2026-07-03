import { config, validateRuntimeConfig } from "../config.js";

const errors = validateRuntimeConfig();

console.log(
  JSON.stringify(
    {
      ok: errors.length === 0,
      errors,
      runtime: {
        nodeEnv: config.NODE_ENV,
        testMode: config.TEST_MODE,
        mockBoardMode: config.MOCK_BOARD_MODE,
        smsProvider: config.SMS_PROVIDER,
        publicBaseUrl: config.PUBLIC_BASE_URL,
        maxSmsPerSchedulerRun: config.MAX_SMS_PER_SCHEDULER_RUN
      }
    },
    null,
    2
  )
);

if (errors.length) process.exit(1);
