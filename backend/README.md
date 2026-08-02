# Impact Arlington API

Requires Node 22.5+ (uses the built-in SQLite module).

```bash
npm run init-db
npm run dev
```

The local SQLite database defaults to `cms.sqlite`. Copy `.env.example` to `.env` and configure values as needed. Development can use the local seed administrator; production has no default credential and refuses to start unless `ADMIN_EMAIL` and a password of at least 12 characters are supplied.

For Render deployment, persistent storage, external image uploads, backups, and production variables, see `../DEPLOYMENT.md`.
