
## Running with accounts and a database

The site works fully offline in the browser. To sync data across devices, run the built-in server (Node.js 22 or newer):

```bash
npm install
npm run build
npm start
```

Then open `http://localhost:3000/Plans/`, create an account from **تنظیمات → حساب من**, and your data is stored in `data/app.db` (SQLite).

For development with hot reload, run `npm run dev` in one terminal and `npm start` in another; Vite forwards `/api` requests to the server.

Environment variables:

- `PORT`: port to listen on (default `3000`).
- `DATA_DIR`: folder for the SQLite database (default `./data`).
- `TRUST_PROXY`: set to `1` when running behind a reverse proxy, so the sign-in rate limit uses the `X-Forwarded-For` address.

Health check: `GET /api/health` returns `{"ok":true}`.

Sign-in and sign-up are limited to 10 attempts per 15 minutes per address. Sessions last 30 days.
