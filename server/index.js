// My Life server: serves the built site and a small JSON API with accounts and
// per-user state stored in SQLite (node:sqlite, built into Node 22+).
//   npm run build && npm start   ->  http://localhost:3000/Plans/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
const port = Number(process.env.PORT) || 3000;
const MAX_STATE_BYTES = 900_000;
const SESSION_DAYS = 30;
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 10;
const TRUST_PROXY = Boolean(process.env.TRUST_PROXY);

// Simple in-memory limiter for sign-in and sign-up (per client address)
const authAttempts = new Map();
function limitAuth(req) {
  const ip = (TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';
  const nowMs = Date.now();
  const entry = authAttempts.get(ip);
  if (!entry || entry.reset < nowMs) {
    authAttempts.set(ip, { count: 1, reset: nowMs + AUTH_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > AUTH_MAX_ATTEMPTS) throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.');
}
setInterval(() => {
  const nowMs = Date.now();
  for (const [ip, entry] of authAttempts) if (entry.reset < nowMs) authAttempts.delete(ip);
}, AUTH_WINDOW_MS).unref();

const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'same-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
};

fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'app.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    salt TEXT NOT NULL,
    hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS states (
    user_id INTEGER PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const stmt = {
  userByName: db.prepare('SELECT id, username, salt, hash FROM users WHERE username = ?'),
  insertUser: db.prepare('INSERT INTO users (username, salt, hash, created_at) VALUES (?, ?, ?, ?)'),
  insertSession: db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)'),
  sessionUser: db.prepare('SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.created_at > ?'),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  getState: db.prepare('SELECT data, updated_at FROM states WHERE user_id = ?'),
  upsertState: db.prepare(`INSERT INTO states (user_id, data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`),
};

const now = () => new Date().toISOString();
const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');

function send(res, status, body) {
  res.writeHead(status, { ...securityHeaders, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function readJson(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, 'The request is too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new HttpError(400, 'Invalid data')); }
    });
    req.on('error', reject);
  });
}

function currentUser(req) {
  const match = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
  const oldest = new Date(Date.now() - SESSION_DAYS * 24 * 3600 * 1000).toISOString();
  return match ? stmt.sessionUser.get(match[1], oldest) || null : null;
}

function requireUser(req) {
  const user = currentUser(req);
  if (!user) throw new HttpError(401, 'Please sign in again');
  return user;
}

function issueSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  stmt.insertSession.run(token, userId, now());
  return token;
}

function validCredentials(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) throw new HttpError(400, 'Username: 3–20 characters, English letters, numbers or _ only');
  if (password.length < 6 || password.length > 100) throw new HttpError(400, 'Password must be 6–100 characters');
  return { username: username.toLowerCase(), password };
}

async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  if (route === 'POST /api/register') {
    limitAuth(req);
    const { username, password } = validCredentials(await readJson(req, 4096));
    if (stmt.userByName.get(username)) throw new HttpError(409, 'This username is already taken');
    const salt = crypto.randomBytes(16).toString('hex');
    stmt.insertUser.run(username, salt, hashPassword(password, salt), now());
    const user = stmt.userByName.get(username);
    return send(res, 201, { token: issueSession(user.id), username });
  }

  if (route === 'POST /api/login') {
    limitAuth(req);
    const { username, password } = validCredentials(await readJson(req, 4096));
    const user = stmt.userByName.get(username);
    const candidate = user ? hashPassword(password, user.salt) : '';
    const ok = user && crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.hash, 'hex'));
    if (!ok) throw new HttpError(401, 'Wrong username or password');
    return send(res, 200, { token: issueSession(user.id), username: user.username });
  }

  if (route === 'POST /api/logout') {
    const match = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
    if (match) stmt.deleteSession.run(match[1]);
    return send(res, 200, { ok: true });
  }

  if (route === 'GET /api/health') {
    return send(res, 200, { ok: true });
  }

  if (route === 'GET /api/me') {
    const user = requireUser(req);
    return send(res, 200, { username: user.username });
  }

  if (route === 'GET /api/state') {
    const user = requireUser(req);
    const row = stmt.getState.get(user.id);
    return send(res, 200, { state: row ? JSON.parse(row.data) : null, updatedAt: row ? row.updated_at : null });
  }

  if (route === 'PUT /api/state') {
    const user = requireUser(req);
    const body = await readJson(req, MAX_STATE_BYTES + 1024);
    if (!body || typeof body.state !== 'object' || Array.isArray(body.state) || body.state === null) {
      throw new HttpError(400, 'Invalid state');
    }
    const data = JSON.stringify(body.state);
    if (data.length > MAX_STATE_BYTES) throw new HttpError(413, 'The data is too large');
    const updatedAt = now();
    stmt.upsertState.run(user.id, data, updatedAt);
    return send(res, 200, { updatedAt });
  }

  throw new HttpError(404, 'Not found');
}

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname.replace(/^\/Plans\/?/, ''));
  if (!rel) rel = 'index.html';
  const file = path.normalize(path.join(dist, rel));
  if (!file.startsWith(dist + path.sep) && file !== dist) return send(res, 403, { error: 'forbidden' });
  let target = file;
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    if (path.extname(rel)) return send(res, 404, { error: 'not found' });
    target = path.join(dist, 'index.html');
  }
  res.writeHead(200, { ...securityHeaders, 'content-type': mime[path.extname(target)] || 'application/octet-stream', 'cache-control': target.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' });
  fs.createReadStream(target).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (url.pathname === '/' || url.pathname === '/Plans') {
      res.writeHead(302, { ...securityHeaders, location: '/Plans/' });
      return res.end();
    }
    if (url.pathname.startsWith('/Plans/') && fs.existsSync(dist)) return serveStatic(req, res, url);
    return send(res, 404, { error: 'not found' });
  } catch (error) {
    if (error instanceof HttpError) return send(res, error.status, { error: error.message });
    console.error(error);
    return send(res, 500, { error: 'Server error. Please try again.' });
  }
});

server.requestTimeout = 30_000;
server.listen(port, () => console.log(`Mylo running at http://localhost:${port}/Plans/`));

function shutdown() {
  server.close(() => {
    try { db.close(); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
