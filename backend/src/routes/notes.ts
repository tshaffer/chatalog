import { Router, Request, Response } from 'express';

export const notesRouter = Router();

// GET /api/v1/notes/ping
notesRouter.get('/ping', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'notes',
    time: new Date().toISOString()
  });
});
