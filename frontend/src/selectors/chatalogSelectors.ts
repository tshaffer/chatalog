import type { Subject, Topic, Note, NotePreview } from '../../../shared/src/types';
import { subjects, topics, notes } from '../mock/chatalogData';

// ----- Find by slug -----
export function findSubjectBySlug(slug?: string): Subject | undefined {
  if (!slug) return undefined;
  return subjects.find(s => s.slug === slug);
}

export function findTopicBySlug(subjectId?: string, slug?: string): Topic | undefined {
  if (!subjectId || !slug) return undefined;
  return topics.find(t => t.subjectId === subjectId && t.slug === slug);
}

export function findNoteBySlug(topicId?: string, slug?: string): Note | undefined {
  if (!topicId || !slug) return undefined;
  return notes.find(n => n.topicId === topicId && n.slug === slug);
}

// ----- Lists for sidebar / main -----
export function getAllSubjects(): Subject[] {
  return subjects;
}

export function getTopicsForSubject(subjectId?: string): Topic[] {
  if (!subjectId) return [];
  return topics.filter(t => t.subjectId === subjectId);
}

export function getNotePreviewsForTopic(topicId?: string): NotePreview[] {
  if (!topicId) return [];
  return notes
    .filter(n => n.topicId === topicId)
    .map<NotePreview>(n => ({
      _id: n._id,
      title: n.title,
      summary: n.summary,
      tags: n.tags,
      updatedAt: n.updatedAt,
    }));
}
