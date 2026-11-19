
## Running with accounts and a database

The site works fully offline in the browser. To sync data across devices, run the built-in server (Node.js 22 or newer):

```bash
npm install
npm run build
npm start
```

Then open `http://localhost:3000/Plans/`, create an account from **تنظیمات → حساب من**, and your data is stored in `data/app.db` (SQLite).

For development with hot reload, run `npm run dev` in one terminal and `npm start` in another; Vite forwards `/api` requests to the server.

Environment variables: `PORT` (default `3000`) and `DATA_DIR` (default `./data`).
