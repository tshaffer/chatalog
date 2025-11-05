import { Request, Response } from 'express';
import { NoteModel } from '../models/Note';

export async function listNotes(req: Request, res: Response) {
  const { subjectId, topicId } = req.query as { subjectId?: string; topicId?: string };
  const filter: any = {};
  if (subjectId) filter.subjectId = subjectId;
  if (topicId) filter.topicId = topicId;

  const docs = await NoteModel.find(
    filter,
    { title: 1, summary: 1, tags: 1, updatedAt: 1 }
  )
    .sort({ updatedAt: -1 })
    .exec();

  res.json(docs.map(d => d.toJSON()));
}

export async function getNote(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await NoteModel.findById(id).exec();
  if (!doc) return res.status(404).json({ message: 'Note not found' });
  res.json(doc.toJSON());
}

export async function createNote(req: Request, res: Response) {
  const { subjectId, topicId, title = 'Untitled', markdown = '', summary, tags = [] } = req.body ?? {};
  const slug = (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const doc = await NoteModel.create({ subjectId, topicId, title, slug, markdown, summary, tags });
  res.status(201).json(doc.toJSON());
}

export async function patchNote(req: Request, res: Response) {
  const { id } = req.params;
  const patch = { ...(req.body ?? {}) };
  delete (patch as any)._id;
  delete (patch as any).createdAt;
  delete (patch as any).backlinks;

  if (typeof patch.title === 'string' && !patch.slug) {
    (patch as any).slug = patch.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const doc = await NoteModel.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  if (!doc) return res.status(404).json({ message: 'Note not found' });
  res.json(doc.toJSON());
}

export async function deleteNote(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await NoteModel.findByIdAndDelete(id).exec();
  if (!doc) return res.status(404).json({ message: 'Note not found' });
  res.status(204).send();
}
