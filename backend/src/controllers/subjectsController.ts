import { Request, Response } from 'express';
import { SubjectModel } from '../models/Subject';

export async function listSubjects(_req: Request, res: Response) {
  const docs = await SubjectModel.find().sort({ name: 1 }).lean();
  res.json(docs.map(d => ({
    _id: String(d._id),
    name: d.name,
    slug: d.slug,
    createdAt: d.createdAt?.toISOString?.(),
    updatedAt: d.updatedAt?.toISOString?.(),
  })));
}

export async function getSubjectById(req: Request, res: Response) {
  const { subjectId } = req.params;
  const d = await SubjectModel.findById(subjectId).lean();
  if (!d) return res.status(404).json({ message: 'Subject not found' });
  res.json({
    _id: String(d._id),
    name: d.name,
    slug: d.slug,
    createdAt: d.createdAt?.toISOString?.(),
    updatedAt: d.updatedAt?.toISOString?.(),
  });
}
