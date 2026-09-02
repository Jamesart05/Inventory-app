# Inventory Server (Express + Prisma + Neon)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` / `DIRECT_URL` — from your Neon project (pooled + direct connection strings)
   - `JWT_SECRET` — any long random string
   - `CLIENT_ORIGIN` — the URL of the Next.js client (e.g. `http://localhost:3000`)
3. Generate the Prisma client and run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   The API runs on `http://localhost:4000` by default.

## API overview

All routes are prefixed with `/api`.

### Auth (`/api/auth`)
- `POST /signup` — `{ name, email, password }`
- `POST /signin` — `{ email, password }`
- `POST /logout`
- `GET /me` — current user (requires auth)

Auth uses an httpOnly cookie by default; the response also includes a `token` you can use as a `Bearer` header for non-browser clients.

### Items (`/api/items`) — all require auth
- `GET /` — list/search items. Query params: `q` (text search across name/sku/category/barcode), `barcode` (exact match), `page`, `pageSize`
- `GET /barcode/:code` — look up a single item by exact barcode (used by the camera scanner)
- `GET /:id` — item detail with recent movements
- `POST /` — create item
- `PUT /:id` — update item
- `DELETE /:id` — delete item

### Movements (`/api/movements`) — all require auth
- `GET /` — list movements. Query params: `itemId`, `type` (`STOCK_IN`/`STOCK_OUT`), `page`, `pageSize`
- `POST /` — record a movement `{ itemId, type, quantity, unitPrice?, reference?, note? }`. Atomically adjusts the item's quantity.
- `DELETE /:id` — delete a movement and reverse its stock effect
