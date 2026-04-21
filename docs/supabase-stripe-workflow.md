# Supabase & Stripe Workflow

A full technical reference for how the database, payments, and email are wired together in this project.

---

## Architecture Overview

```
Browser Cart
    │
    ▼
POST /api/checkout
    ├── Supabase RPC: reserve_stock          ← decrements stock atomically
    ├── Stripe: prices.retrieve              ← get product names/images
    ├── Supabase: products.select (type)     ← get artwork/print type
    └── Stripe: checkout.sessions.create     ← returns hosted checkout URL
            │
            ▼
    Customer completes Stripe checkout
            │
    ┌───────┴───────────────────┐
    │                           │
    ▼                           ▼
checkout.session.completed  checkout.session.expired
    │                           │
    ▼                           ▼
notifyClient()           Supabase RPC: restore_stock
(Resend email)
```

---

## Supabase

### Client Singleton

**File:** `app/_lib/supabase.ts`

Uses the **service-role key** (full database access, bypasses Row Level Security). Only used server-side: Server Components, Server Actions, Route Handlers.

```ts
createServerSupabase() // returns a singleton SupabaseClient
```

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database Tables

#### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Product name |
| `description` | text | |
| `price_hw` | integer | Price in **pence** |
| `stock_level` | integer | Available stock |
| `categories` | text[] | e.g. `['LANDSCAPE', 'BW']` |
| `medium` | text | e.g. `Oil on canvas` |
| `dimensions` | text | |
| `year` | text | |
| `image_url` | text | Public Supabase Storage URL |
| `stripe_product_id` | text | Stripe Product ID |
| `stripe_price_id` | text | Stripe Price ID (used as cart key) |
| `type` | text | `'artwork'` or `'print'` |

#### `settings`
| key | value |
|---|---|
| `shipping_rate_pence` | Integer as string, e.g. `"500"` |
| `categories_visible` | `"true"` or `"false"` |

### Supabase Storage

Bucket: `product-images`

- **Cover images:** stored at `uploads/{timestamp}_{uuid}.{ext}`
- **Gallery images:** stored at `{productId}/{index}_{uuid}.{ext}`

### RPC Functions (Postgres stored procedures)

These must exist in your Supabase project:

#### `reserve_stock(items)`
Atomically decrements `stock_level` for each item. Returns an array of `{ stripe_price_id, title, reserved }` where `reserved: false` means out of stock.

#### `restore_stock(items)`
Increments `stock_level` back. Called on:
- Session expiry (webhook)
- Partial cart failure (if some items fail reservation, successful ones are rolled back)

---

## Stripe

### Client Singleton

**File:** `app/_lib/stripe.ts`

```ts
getStripe() // returns a singleton Stripe instance
```

Environment variable required:
- `STRIPE_SECRET_KEY` (use `sk_test_...` in dev, `sk_live_...` in prod)

### Stripe Connect (Payment Splitting)

The site uses **Stripe Connect destination charges**. The platform (your) Stripe account receives the full payment, retains the application fee, and automatically transfers the remainder to the artist's connected account.

Environment variable:
- `STRIPE_CONNECT_CLIENT_ACCOUNT_ID` — the artist's connected Stripe account ID (e.g. `acct_...`)

**Fee logic** (`app/api/checkout/route.ts`):
```ts
const percentFee = Math.round(totalAmount * 0.05);      // 5% platform fee
const estimatedStripeFee = Math.round(totalAmount * 0.015) + 20; // ~Stripe's fee
// Only add flat 20p if 5% alone doesn't cover the Stripe flat fee (orders < ~£5.71)
applicationFeeAmount = percentFee >= estimatedStripeFee ? percentFee : percentFee + 20;
```

If `STRIPE_CONNECT_CLIENT_ACCOUNT_ID` is not set, no fee splitting occurs — the full payment stays on the platform account.

### Stripe Products & Prices

Each product in Supabase has a matching Stripe Product and Stripe Price:
- Created automatically when a product is added via admin
- Stripe Prices are **immutable** — if a price is edited in admin, a new Stripe Price is created and the `stripe_price_id` in Supabase is updated
- Stripe Products are **deactivated** (not deleted) when a product is removed from admin — Stripe requires payment records to be kept

---

## Checkout Flow

**File:** `app/api/checkout/route.ts`

### Step 1 — Validate cart
Accepts either `{ items: [{ priceId, quantity }] }` or legacy `{ priceId }`.

### Step 2 — Reserve stock
Calls `reserve_stock` RPC. If any items are out of stock:
- Rolls back successful reservations via `restore_stock`
- Returns HTTP 409 with `outOfStock` array

### Step 3 — Fetch metadata
- Fetches Stripe price/product data (name, image) for each item
- Fetches `type` (`artwork`/`print`) from Supabase by `stripe_price_id`
- Builds `enrichedReservations` array stored in session metadata

### Step 4 — Create Stripe session
```ts
stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [...],
  payment_intent_data: {          // only if Connect is configured
    application_fee_amount: ...,
    transfer_data: { destination: clientAccountId },
  },
  metadata: {
    reserved_items: JSON.stringify([{ stripe_price_id, qty, title, price, image, type }]),
    cancel_token: uuid,           // used to verify cancel requests
  },
  expires_at: now + 30 minutes,
  success_url: '/purchase/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url:  '/purchase/cancelled?session_id={CHECKOUT_SESSION_ID}&cancel_token=...',
})
```

Returns `{ url }` — the browser redirects to Stripe's hosted checkout page.

---

## Post-Checkout

### Success — `/purchase/success`

**File:** `app/purchase/success/page.tsx`

Server component. Retrieves the session from Stripe, verifies `payment_status === 'paid'`, displays order summary. Also renders `<ClearCart />` (client component that empties localStorage cart).

### Cancelled — `/purchase/cancelled`

**File:** `app/purchase/cancelled/page.tsx`

Client component. On mount, calls `POST /api/checkout/expire` with `sessionId` and `cancelToken`. This explicitly expires the Stripe session, which triggers the `checkout.session.expired` webhook to restore stock.

### Manual session expiry — `/api/checkout/expire`

Verifies the `cancel_token` matches the session metadata before expiring. This prevents malicious expiry of other users' sessions.

---

## Webhook Handler

**File:** `app/api/webhooks/stripe/route.ts`

Verifies Stripe's signature using `STRIPE_WEBHOOK_SECRET` before processing any event.

### `checkout.session.completed`
- Logs the order
- Calls `notifyClient()` to send order email via Resend
- Stock is **not** restored — the reservation becomes the sale

### `checkout.session.expired`
- Parses `reserved_items` from session metadata
- Calls `restore_stock` RPC to return items to available stock

---

## Order Email (Resend)

**File:** `app/api/webhooks/stripe/route.ts` → `notifyClient()`

Environment variables:
- `RESEND_API_KEY`
- `NOTIFY_EMAIL` — comma-separated list of recipient addresses
- `RESEND_FROM_EMAIL` — sender address (must be a verified Resend domain)

Email contents:
- Customer name, email, phone
- Shipping address
- Items: image thumbnail, title, type (Artwork/Print), quantity, price
- Financial table: Subtotal / Shipping / Total / Fees / Net to you

Fee note in email is informational only — the actual fee deducted is calculated in the checkout route and applied by Stripe.

---

## Admin Authentication

**File:** `app/_lib/adminAuth.ts`, `app/api/admin/session/route.ts`

1. Admin logs in via Supabase Auth (email/password)
2. Client sends the Supabase `access_token` to `POST /api/admin/session`
3. Server verifies the token, checks email against `ADMIN_EMAIL_ALLOWLIST`
4. Sets an HTTP-only cookie: `admin_access_token` (1hr expiry, secure in prod)
5. Every Server Action calls `requireAdminUser()` which re-validates the cookie token against Supabase on every request

Environment variable:
- `ADMIN_EMAIL_ALLOWLIST` — comma-separated emails, e.g. `admin@example.com,other@example.com`

---

## Live Stock Polling

**File:** `GET /api/stock`

`WorkGallery` polls this endpoint on mount to get current stock levels by `stripe_price_id`. Response is `Cache-Control: no-store`. Updates the UI without a full page reload.

---

## Environment Variables Summary

| Variable | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Full DB access — never expose to browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (auth UI) | Public key for Supabase Auth |
| `STRIPE_SECRET_KEY` | Server only | `sk_test_...` dev / `sk_live_...` prod |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | `pk_test_...` dev / `pk_live_...` prod |
| `STRIPE_WEBHOOK_SECRET` | Webhook handler | From Stripe dashboard → Webhooks |
| `STRIPE_CONNECT_CLIENT_ACCOUNT_ID` | Checkout route | Artist's `acct_...` connected account ID |
| `RESEND_API_KEY` | Webhook handler | From Resend dashboard |
| `RESEND_FROM_EMAIL` | Webhook handler | Must be a verified Resend sender domain |
| `NOTIFY_EMAIL` | Webhook handler | Comma-separated order notification recipients |
| `ADMIN_EMAIL_ALLOWLIST` | Auth | Comma-separated admin email addresses |
| `NEXT_PUBLIC_SITE_URL` | Checkout route | e.g. `https://yourdomain.com` |
