import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const KIWOOM_BASE_URL = process.env.KIWOOM_BASE_URL || 'https://api.kiwoom.com';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';

if (!process.env.KIWOOM_APP_KEY || !process.env.KIWOOM_SECRET_KEY) {
  console.warn('WARNING: KIWOOM_APP_KEY / KIWOOM_SECRET_KEY is not configured.');
}

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server tools with no Origin header.
    if (!origin) return callback(null, true);

    const allowedOrigins = CORS_ORIGIN
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

let tokenCache = {
  token: null,
  expiresAt: 0
};

async function getKiwoomAccessToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const appkey = process.env.KIWOOM_APP_KEY;
  const secretkey = process.env.KIWOOM_SECRET_KEY;

  if (!appkey || !secretkey) {
    throw new Error('Kiwoom API credentials are not configured on the server.');
  }

  const response = await fetch(`${KIWOOM_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey,
      secretkey
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.return_code !== 0 || !data.token) {
    const message = data.return_msg || `Kiwoom token request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  // Kiwoom returns expires_dt as YYYYMMDDHHmmss (KST).
  // Cache conservatively for 23 hours if parsing is unavailable.
  let expiresAt = Date.now() + 23 * 60 * 60 * 1000;
  if (typeof data.expires_dt === 'string' && /^\d{14}$/.test(data.expires_dt)) {
    const s = data.expires_dt;
    const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}+09:00`;
    const parsed = Date.parse(iso);
    if (!Number.isNaN(parsed)) expiresAt = parsed;
  }

  tokenCache = { token: data.token, expiresAt };
  return data.token;
}

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'kiwoom-backend',
    message: 'Backend is running.'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Verifies that the backend can obtain a Kiwoom access token.
// The token itself is NEVER returned to the browser.
app.get('/api/kiwoom/connection-test', async (_req, res) => {
  try {
    await getKiwoomAccessToken();
    res.json({ ok: true, message: 'Kiwoom REST API authentication succeeded.' });
  } catch (error) {
    console.error(error);
    res.status(502).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Kiwoom API connection failed.'
    });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.message === 'CORS origin not allowed') {
    return res.status(403).json({ ok: false, message: 'Origin not allowed.' });
  }

  console.error(err);
  return res.status(500).json({ ok: false, message: 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kiwoom backend listening on port ${PORT}`);
});
