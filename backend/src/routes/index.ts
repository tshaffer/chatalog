// backend/src/routes/index.ts
import { Router, Express, Request, Response } from 'express';
import notesRouter from './notes';
import subjectsRouter from './subjects';

export function createRoutes(app: Express) {
  const api = Router();

  api.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true, api: 'v1' });
  });

  // Notes CRUD
  api.use('/notes', notesRouter);

  // Subjects + nested Topics + topic-notes list
  // (subjectsRouter defines:
  //   GET /subjects
  //   GET /subjects/:subjectSlug
  //   GET /subjects/:subjectSlug/topics
  //   GET /subjects/:subjectSlug/topics/:topicSlug/notes
  // )
  api.use('/subjects', subjectsRouter);

  app.use('/api/v1', api);
}
