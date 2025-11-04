import type { Subject, Topic, NotePreview } from '@shared/types';
import { chatalogApi as baseApi } from '../api/chatalogApi';

export const subjectsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Left panel
    getSubjects: build.query<Subject[], void>({
      query: () => ({ url: 'subjects' }),
      providesTags: (res) =>
        res
          ? [{ type: 'Subject' as const, id: 'LIST' }, ...res.map(s => ({ type: 'Subject' as const, id: s._id }))]
          : [{ type: 'Subject' as const, id: 'LIST' }],
    }),

    // Center panel (topics for a selected subject) — ID-based
    getTopicsForSubject: build.query<Topic[], string>({
      // arg = subjectId
      query: (subjectId) => ({ url: `subjects/${subjectId}/topics` }),
      providesTags: (res) =>
        res
          ? [{ type: 'Topic' as const, id: 'LIST' }, ...res.map(t => ({ type: 'Topic' as const, id: t._id }))]
          : [{ type: 'Topic' as const, id: 'LIST' }],
    }),

    // Center panel notes list (previews) — ID-based
    getNotePreviewsForTopic: build.query<NotePreview[], { subjectId: string; topicId: string }>({
      query: ({ subjectId, topicId }) => ({ url: `subjects/${subjectId}/topics/${topicId}/notes` }),
      providesTags: (res) =>
        res
          ? [{ type: 'Note' as const, id: 'LIST' }, ...res.map(n => ({ type: 'Note' as const, id: n._id }))]
          : [{ type: 'Note' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetSubjectsQuery,
  useGetTopicsForSubjectQuery,
  useGetNotePreviewsForTopicQuery,
} = subjectsApi;
