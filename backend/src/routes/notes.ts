import { Router, Request, Response } from 'express';
// Minimal relative import for now (no path mapping needed)
import type { NotePreview } from '../../../shared/src/types';

export const notesRouter = Router();

// GET /api/v1/notes/ping
notesRouter.get('/ping', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'notes',
    time: new Date().toISOString()
  });
});

// GET /api/v1/notes/sample
notesRouter.get('/sample', (_req: Request, res: Response) => {
  const sample: NotePreview = {
    _id: 'note-0001',
    title: 'Designing Effective Prompts',
    summary: 'Guidelines for writing prompts that minimize user confusion.',
    tags: ['AIUX', 'PromptDesign'],
    updatedAt: new Date().toISOString()
  };
  res.json(sample);
});
