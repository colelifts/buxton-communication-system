# Cron Examples

## GitHub Actions Scheduled Trigger

```yaml
name: Buxton Scheduler

on:
  schedule:
    - cron: "0 16-23 * * 1-6"
  workflow_dispatch:

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Call scheduler
        run: |
          curl -fsS -X POST "$SCHEDULER_URL" \
            -H "x-scheduler-secret: $SCHEDULER_SECRET"
        env:
          SCHEDULER_URL: ${{ secrets.SCHEDULER_URL }}
          SCHEDULER_SECRET: ${{ secrets.SCHEDULER_SECRET }}
```

## Render Cron Job

Create a Render cron job with:

```bash
curl -fsS -X POST https://YOUR-DOMAIN/tasks/run-scheduler \
  -H "x-scheduler-secret: YOUR_SECRET"
```

Run every 30 to 60 minutes during business hours.

## UptimeRobot / Better Stack

Use an HTTP monitor that supports custom headers:

- Method: `POST`
- URL: `https://YOUR-DOMAIN/tasks/run-scheduler`
- Header: `x-scheduler-secret: YOUR_SECRET`
