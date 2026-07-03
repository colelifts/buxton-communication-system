# Buxton Communication System

Low-cost automated customer communication system for Buxton Blinds. Monday.com is the source of truth, and SMS is sent through a provider abstraction. Twilio is implemented now; FreedomVoice is stubbed so it can be completed later if its API supports two-way automation.

## What This Includes

- Monday.com board field plan in `docs/monday-board-plan.md`
- Monday.com GraphQL helper
- SMS provider abstraction
- Twilio provider
- FreedomVoice placeholder provider
- Mock SMS provider and mock Monday board mode for local testing
- Message templates
- Scheduler logic for lead, quote, in-progress, appointment, install, and review messages
- Incoming SMS reply webhooks
- Customer reply logging
- Automation pause when a customer replies or `Stop Automation` is checked
- Internal notification when a customer replies
- Safe `TEST_MODE=true`
- `.env.example`
- Docker deployment config

See `docs/local-testing.md` for local scheduler and webhook testing.
See `docs/production-runbook.md` and `docs/cutover-checklist.md` for production rollout.
See `env/` for phase-specific environment examples.

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Keep these defaults while testing locally:

   ```bash
   TEST_MODE=true
   MOCK_BOARD_MODE=true
   SMS_PROVIDER=mock
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Run the scheduler once:

   ```bash
   npm run scheduler:once
   ```

6. Check configuration and mock Monday connectivity:

   ```bash
   npm run config:check
   npm run monday:check
   ```

## Local Webhooks

Incoming Twilio SMS webhook:

```text
POST /webhooks/sms/twilio
```

Twilio delivery status callback:

```text
POST /webhooks/sms/twilio/status
```

Incoming FreedomVoice SMS webhook placeholder:

```text
POST /webhooks/sms/freedomvoice
```

Scheduler endpoint for deployed cron jobs:

```text
POST /tasks/run-scheduler
Header: x-scheduler-secret: your SCHEDULER_SECRET
```

## Monday Setup

Create the board columns from `docs/monday-board-plan.md`, then update the `MONDAY_COL_*` values in `.env` to match your Monday column IDs.

## Production Checklist

- Set `TEST_MODE=false`
- Set `MOCK_BOARD_MODE=false`
- Set `SMS_PROVIDER=twilio`
- Add Monday API token and board ID
- Add Twilio credentials
- Set `FROM_SMS_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`
- Set `INTERNAL_NOTIFICATION_NUMBER`
- Set a strong `SCHEDULER_SECRET`
- Configure Twilio inbound SMS webhook to `https://your-domain.com/webhooks/sms/twilio`
- Configure Twilio status callback to `https://your-domain.com/webhooks/sms/twilio/status`
- Set `PUBLIC_BASE_URL` to the exact public origin Twilio calls, such as `https://your-domain.com`, so webhook signature validation works
- Configure an external cron to call `POST /tasks/run-scheduler`

No secrets are hard-coded. Use environment variables only.
