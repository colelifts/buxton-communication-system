# Production Runbook

## Safety Defaults

- Keep `TEST_MODE=true` until Monday and Twilio are both verified.
- Use `MOCK_BOARD_MODE=true` for deployment smoke tests.
- Switch to production only after `/ready` returns `ok: true`.

## Required Production Environment

```env
TEST_MODE=false
MOCK_BOARD_MODE=false
SMS_PROVIDER=twilio
PUBLIC_BASE_URL=https://your-service.example.com
SCHEDULER_SECRET=long-random-value
MONDAY_API_TOKEN=...
MONDAY_BOARD_ID=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_MESSAGING_SERVICE_SID=...
INTERNAL_NOTIFICATION_NUMBER=+1...
GOOGLE_REVIEW_URL=https://...
```

Use either `TWILIO_MESSAGING_SERVICE_SID` or `FROM_SMS_NUMBER`. A messaging service is preferred.

## Health Checks

- `GET /health`: process is alive.
- `GET /ready`: production configuration is valid.

## Scheduler

Call:

```text
POST /tasks/run-scheduler
x-scheduler-secret: SCHEDULER_SECRET
```

Recommended cadence: every 30 to 60 minutes during business hours. The service prevents overlapping scheduler runs inside a single process and caps sends with `MAX_SMS_PER_SCHEDULER_RUN`.

## Twilio Webhooks

Configure:

- Inbound message webhook: `POST https://your-domain.com/webhooks/sms/twilio`
- Delivery status callback: `POST https://your-domain.com/webhooks/sms/twilio/status`

Set `PUBLIC_BASE_URL` to the exact public origin Twilio calls. Twilio signature validation is enabled outside `TEST_MODE`.

## Monday Cutover

1. Create the board fields from `docs/monday-board-plan.md`.
2. Copy Monday column IDs into `.env` or your host environment.
3. Deploy with `TEST_MODE=true`, `MOCK_BOARD_MODE=false`, and `SMS_PROVIDER=mock`.
4. Run one scheduler pass and confirm Monday updates/logging.
5. Set `SMS_PROVIDER=twilio` while keeping `TEST_MODE=true`.
6. Confirm mock/test logs are still safe.
7. Set `TEST_MODE=false` only for the final controlled live test.

## Incident Response

To stop automation immediately:

- Set `TEST_MODE=true` and redeploy, or
- Disable the scheduler cron, or
- Check `Stop Automation` on affected Monday items.

Customer replies automatically set `Automation Paused` and log the inbound SMS.
