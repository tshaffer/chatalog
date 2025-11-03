// src/components/MainArea.tsx
import { useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import {
  getNotePreviewsForTopic,
  findSubjectBySlug,
  findTopicBySlug,
  findNoteBySlug,
} from '../selectors/chatalogSelectors';
import ResizeHandle from './ResizeHandle';
import { usePersistentState } from '../hooks/usePersistentState';

const MIN_LIST = 260;
const MAX_LIST = 720;
const DEFAULT_LIST = 420;

export default function MainArea() {
  const { subjectSlug, topicSlug, noteSlug } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [noteListWidth, setNoteListWidth] = usePersistentState<number>(
    'ui.noteListWidth',
    DEFAULT_LIST
  );

  const subject = useMemo(() => findSubjectBySlug(subjectSlug), [subjectSlug]);
  const topic = useMemo(
    () => findTopicBySlug(subject?._id, topicSlug),
    [subject?._id, topicSlug]
  );
  const note = useMemo(
    () => findNoteBySlug(topic?._id, noteSlug),
    [topic?._id, noteSlug]
  );
  const noteList = useMemo(
    () => getNotePreviewsForTopic(topic?._id),
    [topic?._id]
  );

  const onDrag = useCallback(
    (dx: number) => {
      setNoteListWidth((w) => {
        const next = Math.min(MAX_LIST, Math.max(MIN_LIST, w + dx));
        return next;
      });
    },
    [setNoteListWidth]
  );

  const goToNote = (title: string) => {
    const slug = slugify(title); // fallback since NotePreview lacks slug
    navigate(`/s/${subject?.slug}/t/${topic?.slug}/n/${slug}`);
  };

  return (
    <Box
      display="grid"
      gridTemplateColumns={`${noteListWidth}px 6px 1fr`}
      height="100%"
      overflow="hidden"
    >
      {/* Left: Note list */}
      <Box overflow="auto" p={2}>
        <Typography variant="overline" color="text.secondary">
          {topic ? 'Notes' : 'Select a Topic to see Notes'}
        </Typography>

        {!topic && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Pick a subject, then a topic to see its notes.
          </Typography>
        )}

        {topic && (
          <List dense>
            {noteList.map((n) => (
              <ListItemButton
                key={n._id}
                selected={note?._id === n._id}
                onClick={() => goToNote(n.title)}
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
            {noteList.length === 0 && topic && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 1 }}>
                No notes in this topic yet.
              </Typography>
            )}
          </List>
        )}
      </Box>

      {/* Center handle */}
      <ResizeHandle aria-label="Resize note list" onDrag={onDrag} />

      {/* Right: Note detail */}
      <Box overflow="auto" p={3}>
        {!note && topic && (
          <Typography variant="body2" color="text.secondary">
            Choose a note from the list.
          </Typography>
        )}
        {!topic && !note && (
          <Typography variant="body2" color="text.secondary">
            Pick a subject and topic to begin.
          </Typography>
        )}
        {note && (
          <>
            <Typography variant="h6" gutterBottom>
              {note.title}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              gutterBottom
              display="block"
            >
              Subject: {subject?.name} • Topic: {topic?.name}
            </Typography>
            <Box mt={2}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {note.markdown}
              </ReactMarkdown>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

// Simple slugify for local navigation when NotePreview lacks slug
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
