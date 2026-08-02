# Production deployment on Render

## 1. External image storage

Create a Cloudinary account and an unsigned upload preset restricted to images and a maximum size of 2 MB. Keep the preset name and cloud name for the Render environment variables. The browser sends the selected image to this API; the API uploads it to Cloudinary and stores only the resulting HTTPS URL in SQLite.

## 2. Deploy the Blueprint

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and connect the repository.
3. Render reads `render.yaml` and creates the static frontend, paid API, and 1 GB persistent disk.
4. Supply every environment variable marked `sync: false`.

Backend values:

```text
ADMIN_EMAIL=your-private-admin-email
ADMIN_PASSWORD=a-unique-password-of-at-least-12-characters
CLIENT_ORIGIN=https://impact-arlington-web.onrender.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=your-restricted-upload-preset
```

Frontend value:

```text
VITE_API_URL=https://impact-arlington-api.onrender.com/api
```

Use the actual Render service URLs. If you add a custom frontend domain, update `CLIENT_ORIGIN` and redeploy the API. Multiple allowed origins can be comma-separated.

## 3. Verify production

Check these in order:

```text
https://impact-arlington-api.onrender.com/api/health
https://impact-arlington-web.onrender.com
```

Then sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`, upload a test profile image, create a test record, restart the API service, and confirm both still exist.

## Persistence and backups

The API stores SQLite at `/var/data/cms.sqlite`. Only `/var/data` is persistent. An application-level SQLite backup is written to `/var/data/backups` every 24 hours and retained for seven days. Render also snapshots persistent disks. For disaster recovery independent of Render, periodically copy a backup off the Render disk.

Run a local on-demand backup with:

```bash
cd backend
npm run backup
```

## Production data rules

- Demo events, fake companies, known attendance codes, and local administrator defaults are disabled when `NODE_ENV=production`. Verified Arlington directory resources remain enabled by `SEED_DIRECTORY_DATA=true`.
- Production refuses to start without an administrator email and a password of at least 12 characters.
- `.env`, SQLite databases, sessions, and backup files are excluded from Git.
- Uploaded profile and business images are stored externally in Cloudinary in production.
