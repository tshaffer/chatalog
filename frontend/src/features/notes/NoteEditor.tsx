import { useEffect, useMemo, useRef, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetNoteQuery, useUpdateNoteMutation } from './notesApi';
import type { Note } from '@shared/types';
import {
  Box,
  Stack,
  TextField,
  Typography,
  Chip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SplitscreenIcon from '@mui/icons-material/Splitscreen';

type Props = { noteId?: string; enableBeforeUnloadGuard?: boolean; debounceMs?: number };

// Remove YAML front matter that starts at the beginning of the doc:
// ---\n...yaml...\n---\n
function stripFrontMatter(md: string | undefined): string {
  if (!md) return '';
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

type Mode = 'edit' | 'preview' | 'split';

export default function NoteEditor({ noteId, enableBeforeUnloadGuard = true, debounceMs = 1000 }: Props) {
  const { data: note, isLoading, isError, error } = useGetNoteQuery(noteId ? noteId : skipToken);
  const [updateNote, { isLoading: isSaving }] = useUpdateNoteMutation();

  if (!noteId) {
    return (
      <Box p={2}>
        <Typography variant="body2" color="text.secondary">No note selected.</Typography>
      </Box>
    );
  }

  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<Mode>('edit');
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false, msg: '', sev: 'success'
  });

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestNoteRef = useRef<Note | undefined>(undefined);

  // Load note -> form
  const noteKey = note?.id;
  useEffect(() => {
    if (!note) return;
    latestNoteRef.current = note;
    setTitle(note.title ?? '');
    setMarkdown(note.markdown ?? '');
    setDirty(false);
  }, [noteKey]);

  // Debounced autosave
  useEffect(() => {
    if (!note) return;
    if (!dirty) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await updateNote({ noteId, patch: { title, markdown } }).unwrap();
        setSnack({ open: true, msg: 'Saved', sev: 'success' });
        setDirty(false);
      } catch (_e) {
        setSnack({ open: true, msg: 'Save failed', sev: 'error' });
      }
    }, debounceMs);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [dirty, title, markdown, noteId, debounceMs, updateNote, note]);

  // Cmd/Ctrl+S
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (!note) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        try {
          await updateNote({ noteId, patch: { title, markdown } }).unwrap();
          setSnack({ open: true, msg: 'Saved', sev: 'success' });
          setDirty(false);
        } catch (_e) {
          setSnack({ open: true, msg: 'Save failed', sev: 'error' });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [note, noteId, title, markdown, updateNote]);

  // Before-unload dirty guard (optional)
  useEffect(() => {
    if (!enableBeforeUnloadGuard) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, enableBeforeUnloadGuard]);

  const status = useMemo(() => {
    if (isLoading) return 'Loading...';
    if (isSaving) return 'Saving...';
    if (dirty) return 'Unsaved changes';
    return 'Saved';
  }, [isLoading, isSaving, dirty]);

  if (isError) {
    return (
      <Box p={2}>
        <Typography color="error">Failed to load note.</Typography>
        <Typography variant="body2">
          {String((error as any)?.data ?? (error as any)?.message ?? error)}
        </Typography>
      </Box>
    );
  }
  if (isLoading || !note) {
    return (
      <Box p={2}>
        <Typography>Loading…</Typography>
      </Box>
    );
  }

  const previewBody = stripFrontMatter(markdown);

  return (
    <Box p={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="h6" sx={{ mr: 2 }}>Edit Note</Typography>
        <Chip
          size="small"
          label={status}
          color={status === 'Saved' ? 'success' : status === 'Saving...' ? 'warning' : dirty ? 'warning' : 'default'}
          variant="outlined"
        />
        <Box sx={{ flex: 1 }} />
        <Tabs
          value={mode}
          onChange={(_, v) => setMode(v)}
          aria-label="Editor mode"
        >
          <Tab value="edit" icon={<EditIcon fontSize="small" />} label="Edit" />
          <Tab value="preview" icon={<VisibilityIcon fontSize="small" />} label="Preview" />
          <Tab value="split" icon={<SplitscreenIcon fontSize="small" />} label="Split" />
        </Tabs>
      </Stack>

      {/* Title field (always shown) */}
      <TextField
        label="Title"
        value={title}
        onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
        size="small"
        fullWidth
      />

      {/* Editor / Preview Area */}
      {mode === 'edit' && (
        <TextField
          label="Markdown"
          value={markdown}
          onChange={(e) => { setMarkdown(e.target.value); setDirty(true); }}
          fullWidth
          multiline
          minRows={12}
          placeholder="Write in Markdown…"
          sx={{ flex: 1, overflow: 'auto' }}
        />
      )}

      {mode === 'preview' && (
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {/* Optional title render */}
          <Typography variant="h5" sx={{ mb: 1 }}>{title || 'Untitled'}</Typography>
          <Divider sx={{ mb: 2 }} />
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {previewBody}
          </ReactMarkdown>
        </Box>
      )}

      {mode === 'split' && (
        <Stack direction="row" spacing={2} sx={{ flex: 1, minHeight: 320, overflow: 'hidden' }}>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <TextField
              label="Markdown"
              value={markdown}
              onChange={(e) => { setMarkdown(e.target.value); setDirty(true); }}
              fullWidth
              multiline
              minRows={12}
              placeholder="Write in Markdown…"
              sx={{ height: '100%' }}
            />
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Preview</Typography>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {previewBody}
            </ReactMarkdown>
          </Box>
        </Stack>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={2000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
