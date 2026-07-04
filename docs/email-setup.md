# Email Setup

Email is implemented as a provider abstraction, like SMS.

## Current Safe Mode

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=mock
TEST_MODE=true
```

This writes email activity to Monday's `Email Log` without sending real email.

## Providers

### Mock

Use for demos and Monday verification.

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=mock
```

### Resend

Good early option for real outbound email. Requires a Resend account, verified domain, and API key.

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=resend
EMAIL_FROM_ADDRESS=hello@yourdomain.com
EMAIL_FROM_NAME=Buxton Blinds
RESEND_API_KEY=...
```

### Brevo

Best free daily cap among the providers researched: commonly listed as 300 emails/day on the free plan. Requires a Brevo account, verified sender/domain, and API key.

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=brevo
EMAIL_FROM_ADDRESS=hello@yourdomain.com
EMAIL_FROM_NAME=Buxton Blinds
BREVO_API_KEY=...
```

Send one controlled test:

```bash
CONFIRM_LIVE_EMAIL=true npm run email:test -- you@example.com "Buxton Blinds test" "This is a test."
```

### SMTP

Use with a real mailbox/provider that supports SMTP app passwords.

```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
EMAIL_FROM_ADDRESS=hello@yourdomain.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
```

## Monday Columns

`npm run monday:ensure` creates:

- Last Outbound Email At
- Last Outbound Email Template
- New Lead Email Sent At
- Quote Email Follow-up Step
- In Progress Last Email Update At
- Appointment Email Reminder 24h At
- Install Email Thank You At
- Review Email Request Sent At
- Email Log

## Cost Notes

Cloudflare Email Routing is free for inbound forwarding. Cloudflare Email Sending to arbitrary customers requires Workers Paid. Resend has a free tier that is usually enough for early transactional email testing, but you still need a verified sending domain. Brevo usually offers more free daily sends, but still requires an account/API key and sender verification.
