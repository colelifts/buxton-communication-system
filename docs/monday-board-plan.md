# Monday.com Board Field Plan

This board is the source of truth for automated customer communication.

## Core Customer Fields

| Field | Suggested Type | Purpose |
| --- | --- | --- |
| Customer Name | Text | Name used in message templates |
| Phone | Phone | Primary SMS number |
| Email | Email | Optional future communication |
| Stage | Status | Workflow stage such as New Lead, Quote Sent, In Progress, Appointment Scheduled, Installed |
| Status | Status | Operational job status |

## Automation Control Fields

| Field | Suggested Type | Purpose |
| --- | --- | --- |
| Automation Paused | Checkbox | Checked automatically when customer replies |
| Stop Automation | Checkbox | Manual override to stop automated sends |
| Last Customer Reply At | Date/Time | Last inbound SMS timestamp |
| Last Outbound SMS At | Date/Time | Last automated outbound timestamp |
| Last Outbound Template | Text | Most recent template key sent |
| SMS Log | Long Text | Running note of inbound/outbound messages |

## Sequence Tracking Fields

| Field | Suggested Type | Purpose |
| --- | --- | --- |
| New Lead Confirmed At | Date/Time | Prevents duplicate lead confirmation |
| Quote Sent At | Date/Time | Starts quote follow-up sequence |
| Quote Follow-up Step | Numbers | Highest quote follow-up step sent |
| In Progress Last Update At | Date/Time | Tracks weekly still-in-progress updates |
| Appointment At | Date/Time | Appointment reminder source date |
| Appointment Reminder 24h At | Date/Time | Prevents duplicate 24-hour reminder |
| Appointment Reminder 2h At | Date/Time | Prevents duplicate 2-hour reminder |
| Install Completed At | Date/Time | Starts post-install sequence |
| After Install Thank You At | Date/Time | Prevents duplicate thank-you |
| Review Request Sent At | Date/Time | Prevents duplicate review request |

## Recommended Stage Values

- New Lead
- Quote Sent
- In Progress
- Appointment Scheduled
- Installed
- Closed Won
- Closed Lost

## Notes

Monday column IDs are often different from display names. After creating columns, copy each column ID into `.env` using the matching `MONDAY_COL_*` variable from `.env.example`.
