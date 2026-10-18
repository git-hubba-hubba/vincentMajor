# Impact Arlington API

Requires Node 22.5+ (uses the built-in SQLite module).

```bash
npm run init-db
npm run dev
```

The local SQLite database defaults to `cms.sqlite`. Copy `.env.example` to `.env` and configure values as needed. Development can use the local seed administrator; production has no default credential and refuses to start unless `ADMIN_EMAIL` and a password of at least 12 characters are supplied.

For Render deployment, persistent storage, external image uploads, backups, and production variables, see `../DEPLOYMENT.md`.

## Password recovery

Sign in → Forgot password sends a single-use link that expires after 30 minutes.
Set `RESEND_API_KEY` and `EMAIL_FROM` (a verified sender) in the backend environment,
and set `PASSWORD_RESET_URL` to the public frontend URL (HTTPS in production).
The URL defaults to the first `CLIENT_ORIGIN` entry. Delivery uses the
[Resend email API](https://resend.com/docs/api-reference/emails/send-email).
Production returns an unavailable message if delivery is not configured.
With `NODE_ENV=development` and no email credentials, reset links appear only in
the backend console for local testing. Never use development mode in production.

Reset tokens are hashed in the database, expire after 30 minutes, and are removed
after a successful reset. Password resets invalidate all of the account’s sessions
and other outstanding reset links. Requests are limited per email and IP address.
Links carry the token in the URL fragment so it is not sent in HTTP requests or
referrer headers. A completed reset returns to sign-in.
