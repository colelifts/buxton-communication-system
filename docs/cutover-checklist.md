# Cutover Checklist

Use this when moving from safe local/mock mode to production.

## 1. Local Verification

```bash
npm run check
npm run build
npm test
npm audit --omit=dev
npm run config:check
npm run monday:check
```

On Windows PowerShell, use `npm.cmd` if `npm` is blocked.

## 2. Monday Verification

Set:

```env
MOCK_BOARD_MODE=false
TEST_MODE=true
SMS_PROVIDER=mock
```

Then run:

```bash
npm run monday:check
npm run scheduler:once
```

Confirm Monday items update and SMS logs append correctly. No real SMS should be sent in this mode.

## 3. Twilio Test Mode Verification

Set:

```env
SMS_PROVIDER=twilio
TEST_MODE=true
```

Run:

```bash
npm run sms:test -- +1YOURNUMBER "Buxton Blinds test in TEST_MODE"
```

This should still use the mock provider because `TEST_MODE=true`.

## 4. Controlled Live SMS

Set:

```env
TEST_MODE=false
SMS_PROVIDER=twilio
MOCK_BOARD_MODE=false
```

Then send exactly one test SMS:

```bash
CONFIRM_LIVE_SMS=true npm run sms:test -- +1YOURNUMBER "Buxton Blinds live test"
```

For Windows PowerShell:

```powershell
$env:CONFIRM_LIVE_SMS='true'; npm.cmd run sms:test -- +1YOURNUMBER "Buxton Blinds live test"
```

## 5. Webhooks

Configure Twilio:

- Incoming SMS: `https://YOUR-DOMAIN/webhooks/sms/twilio`
- Status callback: `https://YOUR-DOMAIN/webhooks/sms/twilio/status`

Confirm `PUBLIC_BASE_URL=https://YOUR-DOMAIN`.

## 6. Scheduler

Configure cron to call:

```text
POST https://YOUR-DOMAIN/tasks/run-scheduler
x-scheduler-secret: SCHEDULER_SECRET
```

Start with a low `MAX_SMS_PER_SCHEDULER_RUN`, such as `5`, for the first production day.
