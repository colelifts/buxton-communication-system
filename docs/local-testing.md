# Local Testing

Local mode is designed to be safe by default.

```env
TEST_MODE=true
MOCK_BOARD_MODE=true
SMS_PROVIDER=mock
MOCK_BOARD_DATA_PATH=./mock-data.local.json
TWILIO_VALIDATE_WEBHOOKS=true
```

The first local run copies `mock-data.example.json` to `mock-data.local.json`. The local file is ignored by git and stores mock Monday updates between runs.
Twilio signature validation is skipped while `TEST_MODE=true`.

## Run the Scheduler

```bash
npm run scheduler:once
```

On Windows PowerShell, if `npm` is blocked by execution policy, use:

```bash
npm.cmd run scheduler:once
```

## Start the Web Server

```bash
npm run dev
```

or on Windows PowerShell:

```bash
npm.cmd run dev
```

## Simulate a Twilio Reply

```bash
curl -X POST http://localhost:3000/webhooks/sms/twilio \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=+15555550100" \
  --data-urlencode "To=+15555550999" \
  --data-urlencode "Body=Thanks, please call me tomorrow" \
  --data-urlencode "MessageSid=SM_mock_reply"
```

Expected result:

- The matching mock customer gets `automationPaused=true`
- `lastCustomerReplyAt` is updated
- The inbound message is appended to `smsLog`
- An internal notification is sent if `INTERNAL_NOTIFICATION_NUMBER` is set

## Reset Mock Board Data

Delete `mock-data.local.json`. The next local run will recreate it from `mock-data.example.json`.
