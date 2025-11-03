// server/src/routes/subjects.ts
import { Router, Request, Response } from 'express';
import { subjects, topics } from '../data/chatalogData';

export const subjectsRouter = Router();

// GET /api/v1/subjects
subjectsRouter.get('/', (_req: Request, res: Response) => {
  res.json(subjects);
});

// GET /api/v1/subjects/slug/:slug
subjectsRouter.get('/slug/:slug', (req: Request, res: Response) => {
  const s = subjects.find((x) => x.slug === req.params.slug);
  if (!s) return res.status(404).json({ error: 'Subject not found' });
  res.json(s);
});

// GET /api/v1/subjects/:subjectId/topics
subjectsRouter.get('/:subjectId/topics', (req: Request, res: Response) => {
  const list = topics.filter((t) => t.subjectId === req.params.subjectId);
  res.json(list);
});

// GET /api/v1/subjects/:subjectId/topics/slug/:slug
subjectsRouter.get('/:subjectId/topics/slug/:slug', (req: Request, res: Response) => {
  const t = topics.find((x) => x.subjectId === req.params.subjectId && x.slug === req.params.slug);
  if (!t) return res.status(404).json({ error: 'Topic not found' });
  res.json(t);
});
