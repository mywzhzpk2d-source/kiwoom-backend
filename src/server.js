import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const KIWOOM_BASE_URL =
  process.env.KIWOOM_BASE_URL || 'https://api.kiwoom.com';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = CORS_ORIGIN
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'kiwoom-backend',
    message: 'Backend is running.'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kiwoom backend listening on port ${PORT}`);
});
