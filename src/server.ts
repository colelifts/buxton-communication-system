import express from "express";
import crypto from "node:crypto";
import helmet from "helmet";
import { config, validateRuntimeConfig } from "./config.js";
import { log } from "./logger.js";
import { runScheduler } from "./automation/scheduler.js";
import { createSmsProvider } from "./messaging/sms-provider.js";
import { createBoardClient } from "./monday/board-client.js";
import { handleIncomingSms } from "./webhooks/incoming-sms.js";
import { parseFreedomVoiceWebhook, parseTwilioWebhook } from "./webhooks/parsers.js";
import { validateTwilioWebhookRequest } from "./webhooks/twilio-signature.js";
import { handleTwilioStatusWebhook } from "./webhooks/twilio-status.js";

export function createApp() {
  const app = express();
  const board = createBoardClient();
  const sms = createSmsProvider();
  let schedulerRunning = false;

  app.use(helmet());
  app.use((req, res, next) => {
    const requestId = req.header("x-request-id") || crypto.randomUUID();
    res.setHeader("x-request-id", requestId);
    res.locals.requestId = requestId;
    next();
  });
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      testMode: config.TEST_MODE,
      mockBoardMode: config.MOCK_BOARD_MODE,
      smsProvider: sms.name
    });
  });

  app.get("/ready", (_req, res) => {
    const configErrors = validateRuntimeConfig();
    res.status(configErrors.length ? 503 : 200).json({
      ok: configErrors.length === 0,
      configErrors,
      testMode: config.TEST_MODE,
      mockBoardMode: config.MOCK_BOARD_MODE,
      smsProvider: sms.name
    });
  });

  app.post("/tasks/run-scheduler", async (req, res, next) => {
    if (req.header("x-scheduler-secret") !== config.SCHEDULER_SECRET) {
      res.status(401).json({ error: "Invalid scheduler secret." });
      return;
    }
    if (schedulerRunning) {
      res.status(409).json({ error: "Scheduler is already running." });
      return;
    }

    schedulerRunning = true;
    try {
      const summary = await runScheduler(board, sms);
      res.json(summary);
    } catch (error) {
      next(error);
    } finally {
      schedulerRunning = false;
    }
  });

  app.post("/webhooks/sms/twilio", async (req, res, next) => {
    try {
      if (!validateTwilioWebhookRequest(req)) {
        res.status(403).json({ error: "Invalid Twilio signature." });
        return;
      }
      await handleIncomingSms(board, sms, parseTwilioWebhook(req.body));
      res.type("text/xml").send("<Response></Response>");
    } catch (error) {
      next(error);
    }
  });

  app.post("/webhooks/sms/twilio/status", async (req, res, next) => {
    try {
      if (!validateTwilioWebhookRequest(req)) {
        res.status(403).json({ error: "Invalid Twilio signature." });
        return;
      }
      handleTwilioStatusWebhook(req.body);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/webhooks/sms/freedomvoice", async (req, res, next) => {
    try {
      await handleIncomingSms(board, sms, parseFreedomVoiceWebhook(req.body));
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    log("error", "request_error", { message, requestId: res.locals.requestId });
    res.status(500).json({ error: message });
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const configErrors = validateRuntimeConfig();
  if (configErrors.length) {
    log("error", "configuration_error", { errors: configErrors });
    process.exit(1);
  }

  createApp().listen(config.PORT, () => {
    log("info", "server_started", { url: `http://localhost:${config.PORT}` });
  });
}
