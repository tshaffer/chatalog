// server/src/routes/topics.ts
import { Router, Request, Response } from 'express';
import { notes } from '../data/chatalogData';

export const topicsRouter = Router();

// GET /api/v1/topics/:topicId/notes  (NotePreview[])
topicsRouter.get('/:topicId/notes', (req: Request, res: Response) => {
  const previews = notes
    .filter((n) => n.topicId === req.params.topicId)
    .map((n) => ({ _id: n._id, title: n.title, summary: n.summary, tags: n.tags, updatedAt: n.updatedAt }));
  res.json(previews);
});

// GET /api/v1/topics/:topicId/notes/slug/:slug  (full Note)
topicsRouter.get('/:topicId/notes/slug/:slug', (req: Request, res: Response) => {
  const note = notes.find((n) => n.topicId === req.params.topicId && n.slug === req.params.slug);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});
