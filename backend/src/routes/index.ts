import { Router, Express, Request, Response } from 'express';
import { notesRouter } from './notes';

export function createRoutes(app: Express) {
  const api = Router();

  // Simple API health check: GET /api/v1/health
  api.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, api: 'v1' });
  });

  // Mount feature routers
  api.use('/notes', notesRouter);

  // Mount base path
  app.use('/api/v1', api);
}
