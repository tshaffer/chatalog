import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, List, ListItemButton, ListItemText, Typography, Chip, Stack } from '@mui/material';

import NoteEditor from '../features/notes/NoteEditor';
import { useGetNoteQuery } from '../features/notes/notesApi';
import { usePersistentState } from '../hooks/usePersistentState';
import ResizeHandle from './ResizeHandle';
import {
  useGetNotePreviewsForTopicQuery,
  useGetSubjectsQuery,
  useGetTopicsForSubjectQuery,
} from '../features/subjects/subjectsApi';

const MIN_LIST = 260;
const MAX_LIST = 720;
const DEFAULT_LIST = 420;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function MainArea() {
  // Route params: pretty slugs for subject/topic, ID-first for note with cosmetic slug
  const { subjectSlug, topicSlug, noteId: noteIdParam, noteSlug } = useParams<{
    subjectSlug?: string;
    topicSlug?: string;
    noteId?: string;   // pattern: <id> or <id>-<slug>
    noteSlug?: string; // present only when route used :noteId-:noteSlug
  }>();
  const navigate = useNavigate();

  // --- Subject by slug (client-side) ---
  const { data: subjects = [] } = useGetSubjectsQuery();
  const subject = useMemo(
    () => subjects.find((s) => s.slug === subjectSlug),
    [subjects, subjectSlug]
  );

  // --- Topics for subject (ID-based) ---
  const { data: topics = [] } = useGetTopicsForSubjectQuery(subject?._id ?? '', {
    skip: !subject?._id,
  });
  const topic = useMemo(
    () => topics.find((t) => t.slug === topicSlug),
    [topics, topicSlug]
  );

  // --- Note previews for topic (ID-based) ---
  const { data: previews = [] } = useGetNotePreviewsForTopicQuery(
    { subjectId: subject?._id ?? '', topicId: topic?._id ?? '' },
    { skip: !subject?._id || !topic?._id }
  );

  // --- Note detail (ID-only for editor) ---
  const noteIdOnly = useMemo(() => (noteIdParam ?? '').split('-')[0], [noteIdParam]);

  // Fetch note as well so we can canonicalize the URL slug (RTKQ will de-dupe with NoteEditor)
  const { data: note } = useGetNoteQuery(noteIdOnly, { skip: !noteIdOnly });

  // Optional: canonicalize URL if slug changed/missing
  if (note && subject && topic) {
    const expectedSlug = slugify(note.title);
    const currentSlug = noteSlug ?? '';
    if (expectedSlug !== currentSlug) {
      const next = `/s/${subject.slug}/t/${topic.slug}/n/${note._id}-${expectedSlug}`;
      if (next !== location.pathname) {
        queueMicrotask(() => navigate(next, { replace: true }));
      }
    }
  }

  const [noteListWidth, setNoteListWidth] = usePersistentState<number>(
    'ui.noteListWidth',
    DEFAULT_LIST
  );

  const goToNote = (id: string, title: string) => {
    if (!subject || !topic) return;
    const s = slugify(title);
    navigate(`/s/${subject.slug}/t/${topic.slug}/n/${id}-${s}`);
  };

  return (
    <Box display="grid" gridTemplateColumns={`${noteListWidth}px 6px 1fr`} height="100%" overflow="hidden">
      {/* Left: Note list */}
      <Box overflow="auto" p={2}>
        <Typography variant="overline" color="text.secondary">
          {topic ? 'Notes' : 'Select a Topic to see Notes'}
        </Typography>
        {topic && (
          <List dense>
            {previews.map((n) => (
              <ListItemButton
                key={n._id}
                selected={noteIdOnly === n._id}
                onClick={() => goToNote(n._id, n.title)}
              >
                <ListItemText
                  primary={n.title}
                  secondary={n.summary}
                  primaryTypographyProps={{ variant: 'body2' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {n.tags?.length ? (
                  <Stack direction="row" gap={0.5}>
                    {n.tags.slice(0, 2).map((tag) => (
                      <Chip key={tag} size="small" label={tag} />
                    ))}
                  </Stack>
                ) : null}
              </ListItemButton>
            ))}
            {previews.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                No notes in this topic yet.
              </Typography>
            )}
          </List>
        )}
      </Box>

      {/* Center handle */}
      <ResizeHandle
        aria-label="Resize note list"
        onDrag={(dx) => setNoteListWidth((w) => Math.min(MAX_LIST, Math.max(MIN_LIST, w + dx)))}
      />

      {/* Right: Note detail (editable) */}
      <Box overflow="auto" p={3}>
        {!noteIdOnly && topic && (
          <Typography variant="body2" color="text.secondary">
            Choose a note from the list.
          </Typography>
        )}
        {!topic && !noteIdOnly && (
          <Typography variant="body2" color="text.secondary">
            Pick a subject and topic to begin.
          </Typography>
        )}
        {noteIdOnly && <NoteEditor noteId={noteIdOnly} debounceMs={1000} enableBeforeUnloadGuard />}
      </Box>
    </Box>
  );
}
