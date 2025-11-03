import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Subject, Topic, Note, NotePreview } from '@shared/types';

// Adjust the baseUrl to match your server (e.g., '' if same origin/proxy)
export const chatalogApi = createApi({
  reducerPath: 'chatalogApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Subject', 'Topic', 'Note'],
  endpoints: (build) => ({
    // ---- Subjects ----
    getSubjects: build.query<Subject[], void>({
      query: () => `/subjects`,
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'Subject' as const, id: s._id })),
              { type: 'Subject' as const, id: 'LIST' },
            ]
          : [{ type: 'Subject' as const, id: 'LIST' }],
    }),
    getSubjectBySlug: build.query<Subject, string>({
      query: (slug) => `/subjects/slug/${slug}`,
      providesTags: (r) => (r ? [{ type: 'Subject', id: r._id }] : []),
    }),

    // ---- Topics ----
    getTopicsBySubject: build.query<Topic[], string>({
      // subjectId
      query: (subjectId) => `/subjects/${subjectId}/topics`,
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: 'Topic' as const, id: t._id })),
              { type: 'Topic' as const, id: 'LIST' },
            ]
          : [{ type: 'Topic' as const, id: 'LIST' }],
    }),
    getTopicBySlug: build.query<Topic, { subjectId: string; slug: string }>({
      query: ({ subjectId, slug }) => `/subjects/${subjectId}/topics/slug/${slug}`,
      providesTags: (r) => (r ? [{ type: 'Topic', id: r._id }] : []),
    }),

    // ---- Notes ----
    getNotePreviewsByTopic: build.query<NotePreview[], string>({
      // topicId
      query: (topicId) => `/topics/${topicId}/notes`,
      providesTags: (result) =>
        result
          ? [
              ...result.map((n) => ({ type: 'Note' as const, id: n._id })),
              { type: 'Note' as const, id: 'LIST' },
            ]
          : [{ type: 'Note' as const, id: 'LIST' }],
    }),
    getNoteBySlug: build.query<Note, { topicId: string; slug: string }>({
      query: ({ topicId, slug }) => `/topics/${topicId}/notes/slug/${slug}`,
      providesTags: (r) => (r ? [{ type: 'Note', id: r._id }] : []),
    }),
  }),
});

// Hooks
export const {
  useGetSubjectsQuery,
  useGetSubjectBySlugQuery,
  useGetTopicsBySubjectQuery,
  useGetTopicBySlugQuery,
  useGetNotePreviewsByTopicQuery,
  useGetNoteBySlugQuery,
} = chatalogApi;

