// server/src/routes/index.ts
import { Router, Express, Request, Response } from 'express';
import { notesRouter } from './notes';
import { subjectsRouter } from './subjects';
import { topicsRouter } from './topics';

export function createRoutes(app: Express) {
  const api = Router();

  api.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, api: 'v1' });
  });

  api.use('/notes', notesRouter);

  // NEW
  api.use('/subjects', subjectsRouter);
  api.use('/topics', topicsRouter);

  app.use('/api/v1', api);
}
