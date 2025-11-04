import { Request, Response } from 'express';
import { TopicModel } from '../models/Topic';
import { NoteModel } from '../models/Note';

export async function listTopicsForSubjectId(req: Request, res: Response) {
  const { subjectId } = req.params;
  const topics = await TopicModel.find({ subjectId }).sort({ name: 1 }).lean();
  res.json(topics.map(t => ({
    _id: String(t._id),
    subjectId: String(t.subjectId),
    name: t.name,
    slug: t.slug,
    createdAt: t.createdAt?.toISOString?.(),
    updatedAt: t.updatedAt?.toISOString?.(),
  })));
}

// notes list for a topic (previews), ID-based
export async function listNotesForSubjectTopicIds(req: Request, res: Response) {
  const { subjectId, topicId } = req.params;
  // You can skip validating subjectId matches; or enforce it with a findOne check on TopicModel
  const notes = await NoteModel.find(
    { topicId },
    { title: 1, summary: 1, tags: 1, updatedAt: 1 }
  )
    .sort({ updatedAt: -1 })
    .lean();

  res.json(notes.map(n => ({
    _id: String(n._id),
    title: n.title,
    summary: n.summary,
    tags: n.tags ?? [],
    updatedAt: n.updatedAt?.toISOString?.(),
  })));
}
