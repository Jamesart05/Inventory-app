# Inventory PWA

A full-stack inventory management Progressive Web App.

- **`client/`** — Next.js (App Router) PWA: sign up/in/out, item list & detail,
  create/edit/delete items, barcode camera scanning, keyword search, and
  stock-in/stock-out movement recording. Installable, works offline for
  already-visited pages.
- **`server/`** — Express API backed by Prisma + Neon Postgres: auth (JWT in
  an httpOnly cookie), items CRUD, barcode lookup, and movement recording with
  atomic stock adjustments.

## Quick start

```bash
# 1. Server
cd server
npm install
cp .env.example .env      # fill in DATABASE_URL / DIRECT_URL (Neon), JWT_SECRET, CLIENT_ORIGIN
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev                # http://localhost:4000

# 2. Client (in a second terminal)
cd client
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev                # http://localhost:3000
```

Open `http://localhost:3000`, sign up, and start adding items.

## Environment variables you'll need to supply

**`server/.env`**
| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (used at runtime) |
| `DIRECT_URL` | Neon direct connection string (used by Prisma Migrate) |
| `JWT_SECRET` | Long random string used to sign auth tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `COOKIE_NAME` | Name of the auth cookie, e.g. `inv_token` |
| `PORT` | API port, e.g. `4000` |
| `CLIENT_ORIGIN` | URL(s) of the deployed client, comma-separated, for CORS |

**`client/.env.local`**
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Express API, e.g. `https://your-api.example.com/api` |

## Architecture notes

- **Auth**: bcrypt-hashed passwords, JWTs stored in an httpOnly cookie (also
  returned in the JSON response so non-browser/native clients can use a
  Bearer header instead). `requireAuth` middleware protects all item/movement
  routes.
- **Data model**: `User 1—N Item`, `Item 1—N Movement`. Each `Movement` is
  either `STOCK_IN` or `STOCK_OUT`; creating one adjusts the parent item's
  `quantity` inside a single Prisma transaction so stock counts can't drift.
- **Search**: `/api/items?q=...` does a case-insensitive match across name,
  description, SKU, category, and barcode. `/api/items/barcode/:code` is a
  fast exact-match lookup used by the camera scanner.
- **PWA**: hand-rolled `manifest.json` + `sw.js` (no framework plugin), so it
  has no extra build step — just static files in `client/public/`.
- **Deployment**: the client (Next.js) and server (Express) are independent
  and can be deployed separately — e.g. client on Vercel, server on
  Render/Fly/Railway, database on Neon. Just point `NEXT_PUBLIC_API_URL` and
  `CLIENT_ORIGIN` at each other's deployed URLs and make sure cookies work
  cross-site (`secure: true`, `sameSite: 'none'` in production, already set
  in `auth.controller.js`).
