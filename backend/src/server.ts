import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const PORT = Number(process.env.PORT || 8080);

async function main() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // Health
  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  // Static frontend (served from backend/public by your webpack build)
  const publicDir = path.resolve(process.cwd(), 'backend/public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  } else {
    console.warn(`[WARN] No frontend build at ${publicDir}. Run frontend build first.`);
  }

  // Central error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = Number(err?.statusCode || err?.status || 500);
    const message = typeof err?.message === 'string' ? err.message : 'Internal Server Error';
    if (status >= 500) console.error('[ERROR]', err);
    res.status(status).json({ error: message });
  });

  app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
    if (fs.existsSync(publicDir)) {
      console.log(`✅ Serving frontend from ${publicDir}`);
      console.log(`➡  Open http://localhost:${PORT}`);
    }
  });
}

main().catch((err) => {
  console.error('❌ Failed to start server', err);
  process.exit(1);
});
