// src/pages/Notes.tsx
import React, { useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import Sidebar from '../components/Sidebar';
import MainArea from '../components/MainArea';
import ResizeHandle from '../components/ResizeHandle';
import { usePersistentState } from '../hooks/usePersistentState';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useGetNoteQuery } from '../features/notes/notesApi';

const MIN_SIDEBAR = 220;
const MAX_SIDEBAR = 480;
const DEFAULT_SIDEBAR = 300;

function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}


export default function Notes() {
  const navigate = useNavigate();
  const { subjectSlug, topicSlug, noteId, noteSlug } = useParams<{
    subjectSlug?: string;
    topicSlug?: string;
    noteId?: string;     // from route: /n/:noteId-:noteSlug  OR  /n/:noteId
    noteSlug?: string;   // present only in the first pattern
  }>();

  // Note: if you kept a route like /n/:noteIdAndSlug instead,
  // you'd split with: const id = (noteIdAndSlug ?? '').split('-')[0];
  const id = useMemo(() => (noteId ?? '').split('-')[0], [noteId]);

  // Fetch by ID only (ID-first)
  const { data: note } = useGetNoteQuery(id, { skip: !id });

  // Optional: keep URL canonical if title's slug changed
  useEffect(() => {
    if (!note || !id || !subjectSlug || !topicSlug) return;
    const expectedSlug = slugify(note.title);
    // If route had no slug or wrong slug, replace with canonical
    if (noteSlug !== expectedSlug) {
      navigate(`/s/${subjectSlug}/t/${topicSlug}/n/${note._id}-${expectedSlug}`, { replace: true });
    }
  }, [note, id, noteSlug, subjectSlug, topicSlug, navigate]);



  const [sidebarWidth, setSidebarWidth] = usePersistentState<number>(
    'ui.sidebarWidth',
    DEFAULT_SIDEBAR
  );

  const onDrag = useCallback(
    (dx: number) => {
      setSidebarWidth((w) => {
        const next = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, w + dx));
        return next;
      });
    },
    [setSidebarWidth]
  );

  return (
    <Box
      display="grid"
      gridTemplateColumns={`${sidebarWidth}px 6px 1fr`}
      height="calc(100vh - 64px)" // subtract AppBar; tweak if your AppBar height differs
    >
      <Paper variant="outlined" square sx={{ p: 1, overflow: 'auto' }}>
        <Sidebar />
      </Paper>

      <ResizeHandle
        aria-label="Resize sidebar"
        onDrag={onDrag}
        style={{}}
      />

      <Box sx={{ overflow: 'hidden' }}>
        <MainArea />
      </Box>
    </Box>
  );
}
