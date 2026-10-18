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

## Store and Stripe Checkout

Admins manage products and orders in **Admin → Products & orders**. The **Store**
navigation item is the public catalog. Purchases require a signed-in account.
Products are priced in USD, with a $0.50 minimum, up to 10 units per checkout.
Archiving removes a product from sale without deleting order history. Products
have unlimited inventory; add only products that can be fulfilled. Shipping items
collect a US address; include shipping costs in the price and describe fulfillment
in the product description. Tax calculation, stock tracking, refunds, and shipping
labels are not automated by this implementation. Refunds can be managed in Stripe.

Configure these **backend-only** environment variables and restart the server:

```dotenv
STRIPE_SECRET_KEY=sk_test_replace_with_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_replace_with_your_endpoint_signing_secret
STORE_URL=https://your-frontend.example
```

Use sandbox/test keys first. `STORE_URL` falls back to the first `CLIENT_ORIGIN`
entry; production requires HTTPS. Never put secret keys in `VITE_*` variables or
commit `.env`. Hosted Checkout redirects to the URL created by the server, so a
frontend publishable key is not required. The official Stripe Node SDK handles
Checkout and webhook signature verification.

Create a Stripe webhook destination pointing to:

```
https://your-backend.example/api/stripe/webhook
```

Subscribe to `checkout.session.completed`, `checkout.session.expired`,
`checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`.
Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`. Checkout stays
disabled until both secrets are set. The server verifies the raw request body,
checks the order's session, amount and currency, and records payment once. A
success-page visit alone never marks an order paid. Only paid orders can be marked
fulfilled by an administrator. Customer order histories are scoped to their account.

For local testing with the Stripe CLI:

```bash
stripe listen --forward-to localhost:4000/api/stripe/webhook
```

Use the signing secret printed by that command for local testing, set
`STORE_URL=http://localhost:5173`, and complete a test-mode purchase from the Store.
Confirm the order becomes paid once and appears in the admin order list. Test
cancellation and webhook retries before switching to live credentials. Configure
a separate live webhook destination and live signing secret when going live.

Official references: [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create),
[fulfilling orders](https://docs.stripe.com/checkout/fulfillment), and
[webhook signatures](https://docs.stripe.com/events/manage-webhook-endpoints#signature-errors).

Run the isolated mock Stripe integration tests with `node --test store.test.js`.
These tests do not charge cards or call Stripe's live service.

## Reduced point awards

New registration and the default event award are 50 points. Website visits and
video defaults are 12, business visits 25, purchases 50, and finding Vincent stays at 75.
Odd values round down. On the first backend start after this update, a versioned
migration halves existing event awards and the published video award once. A
video configured for 1 point remains at the 1-point minimum. Administrators can
still set custom event and video awards. Existing account balances, incentive
claims, reward costs, and badge thresholds are preserved. Past event attendance
stores its original award so historical points and badges remain accurate.

### Coming Soon collection

Render runs `npm run seed-store-demos` before starting the API so the collection
is added to its persistent database as well as local development databases.
For an existing Render service, set its Start Command to
`npm run seed-store-demos && npm start` and redeploy if it does not sync Blueprint changes.
Run `npm run seed-store-demos` locally to add three IMPACT shirt concepts: The Original,
After Hours, and Good Neighbors. The script is safe to run again and preserves
existing products. All three are published with `coming_soon=1`, preview prices,
and matching generated mockups in `frontend/cms-arlington/cms-admin-arl/public/images/store/`.
The Coming Soon badge is displayed on every demo, quantity and purchase buttons
are disabled, and the backend rejects checkout requests for these products.
Admins can toggle Coming Soon from the product editor when an item is ready.
Existing products keep their current availability.
