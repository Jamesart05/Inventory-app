# Inventory Client (Next.js PWA)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to your
   Express server's URL (e.g. `http://localhost:4000/api`, or your deployed API).
3. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## PWA notes

- `public/manifest.json` defines the app name, icons, theme colors, and shortcuts
  (scan barcode / add item) shown on Android's install/long-press menu.
- `public/sw.js` is a hand-written service worker (no build plugin required):
  - API calls (`/api/*`) always hit the network; if offline, a JSON `503` is
    returned so the UI can show a friendly message.
  - Page navigations are network-first with a cache fallback, and fall back to
    `/offline` if nothing is cached yet.
  - Static assets are cache-first.
- The service worker is registered client-side by `components/SWRegister.tsx`,
  included in the root layout.
- Replace `public/icons/icon-192.png` and `icon-512.png` with your own branded
  icons before shipping (any square PNG works — maskable icons should keep
  important content within the center ~80% safe zone).
- For a fully installable app you'll want to serve the client over HTTPS
  (required by browsers for service workers, other than on `localhost`).

## Pages

- `/login`, `/signup` — auth screens
- `/items` — list + text search, bottom nav home
- `/items/new` — create an item (supports scanning a barcode into the form)
- `/items/[id]` — item detail, edit/delete, record a stock-in/out movement,
  recent movement history
- `/items/[id]/edit` — edit an existing item
- `/search` — camera barcode scan (jumps straight to the matching item) and
  keyword search
- `/movements` — full movement history with stock-in/out filter

## Barcode scanning

Uses [`html5-qrcode`](https://github.com/mebjas/html5-qrcode), which wraps the
device camera and works for both QR codes and common 1D barcode symbologies
(EAN, UPC, Code128, etc.) in supporting browsers. It requires the page to be
served over HTTPS (or `localhost`) and the user to grant camera permission.
