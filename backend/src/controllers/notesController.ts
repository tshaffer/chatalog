import { Request, Response } from 'express';
import { NoteModel } from '../models/Note';

export async function listNotes(req: Request, res: Response) {
  const { subjectId, topicId } = req.query as { subjectId?: string; topicId?: string };
  const filter: any = {};
  if (subjectId) filter.subjectId = subjectId;
  if (topicId) filter.topicId = topicId;

  const docs = await NoteModel.find(filter, { title: 1, summary: 1, tags: 1, updatedAt: 1 }).sort({ updatedAt: -1 }).lean();
  // Shape to NotePreview
  const previews = docs.map((d) => ({
    _id: String(d._id),
    title: d.title,
    summary: d.summary,
    tags: d.tags ?? [],
    updatedAt: d.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  }));
  res.json(previews);
}

export async function getNote(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await NoteModel.findById(id).lean();
  if (!doc) return res.status(404).json({ message: 'Note not found' });
  res.json({
    ...doc,
    _id: String(doc._id),
    createdAt: doc.createdAt?.toISOString?.(),
    updatedAt: doc.updatedAt?.toISOString?.(),
  });
}

export async function createNote(req: Request, res: Response) {
  const { subjectId, topicId, title = 'Untitled', markdown = '', summary, tags = [] } = req.body ?? {};
  // A simple slug for now
  const slug = (title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const doc = await NoteModel.create({
    subjectId, topicId, title, slug, markdown, summary, tags,
  });
  res.status(201).json({
    ...doc.toObject(),
    _id: String(doc._id),
    createdAt: doc.createdAt?.toISOString?.(),
    updatedAt: doc.updatedAt?.toISOString?.(),
  });
}

export async function patchNote(req: Request, res: Response) {
  const { id } = req.params;
  const patch = req.body ?? {};
  // prevent accidental id/createdAt changes
  delete patch._id; delete patch.createdAt; delete patch.backlinks; // backlinks usually computed

  if (typeof patch.title === 'string' && !patch.slug) {
    patch.slug = patch.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const doc = await NoteModel.findByIdAndUpdate(
    id,
    { $set: { ...patch } },
    { new: true }
  ).lean();

  if (!doc) return res.status(404).json({ message: 'Note not found' });
  res.json({
    ...doc,
    _id: String(doc._id),
    createdAt: doc.createdAt?.toISOString?.(),
    updatedAt: doc.updatedAt?.toISOString?.(),
  });
}

export async function deleteNote(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await NoteModel.findByIdAndDelete(id);
  if (!doc) return res.status(404).json({ message: 'Note not found' });
  res.status(204).send();
}
