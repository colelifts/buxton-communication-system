# Monday Column ID Guide

Monday display names are not always the same as column IDs. The app uses column IDs.

## How to Find Column IDs

1. Open the Monday board.
2. Open board settings or column settings.
3. Copy each column ID into the matching `MONDAY_COL_*` env var.
4. Run `npm run monday:check`.

## Required Env Vars

Use `.env.example` as the canonical list. The most important mappings are:

- `MONDAY_COL_CUSTOMER_NAME`
- `MONDAY_COL_PHONE`
- `MONDAY_COL_STAGE`
- `MONDAY_COL_AUTOMATION_PAUSED`
- `MONDAY_COL_STOP_AUTOMATION`
- `MONDAY_COL_LAST_CUSTOMER_REPLY_AT`
- `MONDAY_COL_LAST_OUTBOUND_SMS_AT`
- `MONDAY_COL_LAST_OUTBOUND_TEMPLATE`
- `MONDAY_COL_SMS_LOG`

## Verification Flow

Set `MOCK_BOARD_MODE=false`, `TEST_MODE=true`, and `SMS_PROVIDER=mock`, then run:

```bash
npm run monday:check
npm run scheduler:once
```

This confirms Monday reads and writes without sending real SMS.
