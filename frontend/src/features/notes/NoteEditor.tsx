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
  Divider,
} from '@mui/material';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// ---------------- helpers ----------------

function stripFrontMatter(md: string | undefined): string {
  if (!md) return '';
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

// Unescape common sequences coming from serialized text
function unescapeEscapes(s: string): string {
  return s
    .replace(/\\\\/g, '\\')  // \\  -> \
    .replace(/\\"/g, '"')     // \"  -> "
    .replace(/\\n/g, '\n')    // \n  -> newline
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

// Turn a multi-line string into a Markdown blockquote
function toBlockquote(s: string): string {
  return s
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n');
}

/**
 * Replace every :::turns ... ::: (or :::end-turns) block with plain Markdown.
 * Supports YAML-style items:
 *
 * :::turns
 * - role: user
 *   text: "Prompt..."
 * - role: assistant
 *   text: "Markdown with \\n, lists, headings, etc."
 * :::end-turns
 */
function normalizeTurns(md: string): string {
  // Find each turns block
  const reBlock = /:::turns\s*([\s\S]*?)(?:^\s*:::end-turns\s*$|^\s*:::\s*$|\Z)/gim;

  return md.replace(reBlock, (_m, body: string) => {
    // NEW: handle escaped quotes inside the quoted text
    // role: <word> \n text: "<content where \" is allowed>"
    const reItem = /role:\s*(\w+)[^\S\r\n]*[\r\n]+[\t ]*text:\s*"((?:\\.|[^"\\])*)"/gi;

    const out: string[] = [];
    let mm: RegExpExecArray | null;
    while ((mm = reItem.exec(body)) !== null) {
      const role = (mm[1] || '').toLowerCase();
      const text = unescapeEscapes(mm[2] || '');

      if (role === 'user') {
        out.push('**Prompt**', '', toBlockquote(text), '');
      } else {
        out.push('**Response**', '', text, '');
      }
    }

    return out.length ? out.join('\n').trim() + '\n' : '';
  });
}

// ---------------- component ----------------

type Props = { noteId?: string; enableBeforeUnloadGuard?: boolean; debounceMs?: number };

export default function NoteEditor({ noteId, enableBeforeUnloadGuard = true, debounceMs = 1000 }: Props) {
  const { data: note, isLoading, isError, error } = useGetNoteQuery(noteId ? noteId : skipToken);
  const [updateNote, { isLoading: isSaving }] = useUpdateNoteMutation();

  if (!noteId) {
    return <Box p={2}><Typography variant="body2" color="text.secondary">No note selected.</Typography></Box>;
  }

  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [dirty, setDirty] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({ open: false, msg: '', sev: 'success' });

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
      } catch {
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
        } catch {
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
        <Typography variant="body2">{String((error as any)?.data ?? (error as any)?.message ?? error)}</Typography>
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

  // >>> Preprocess here
  // const previewBody = normalizeTurns(stripFrontMatter(markdown));
  const testMarkdown = `:::turns
- role: user
  text: "Still testing chatalog rendering. Respond with a short snippet that includes some markdown that will test the escaping mechanism of chatalog."
- role: assistant
  text: "Here’s a compact markdown snippet that stresses escaping and directive parsing:\n## Escaping Test\n\n- Literal colons: \`::\`\n- Directive-like but should render as text: :::note *not a block*\n- Inline code with backticks: \`\` \`code\` \`\`\n- Triple backticks inside a fenced block:\n\n\nnginxCopy codenested\n\nyamlCopy code- YAML front matter imitation:\n---\ntitle: \"fake front matter --- inside content\"\n---\n- Markdown link with brackets: [link](https://example.com)\n- Mixed emphasis: **bold _and_ italic**\n\nThis snippet mixes fence nesting, ::: sequences, and front-matter–style separators — all good for testing Chatalog’s preprocessing and escaping logic."
- role: user
  text: "Now give me two sentences with small formatting."
- role: assistant
  text: "Here’s a compact sample:\nThis is **bold text** with some *italics* and inline \`code\`.\nHere’s a [link](https://example.com) and an emoji 😊 to test inline rendering."
:::end-turns
`;
  const previewBody = normalizeTurns(stripFrontMatter(testMarkdown));
  debugger;

  return (
    <Box p={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Edit Note</Typography>
        <Chip
          size="small"
          label={status}
          color={status === 'Saved' ? 'success' : status === 'Saving...' ? 'warning' : dirty ? 'warning' : 'default'}
          variant="outlined"
        />
      </Stack>

      <TextField
        label="Title"
        value={title}
        onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
        size="small"
        fullWidth
      />

      {/* Editor */}
      <TextField
        label="Markdown"
        value={markdown}
        onChange={(e) => { setMarkdown(e.target.value); setDirty(true); }}
        fullWidth
        multiline
        minRows={10}
        placeholder="Write in Markdown…"
        sx={{ flex: 1, overflow: 'auto' }}
      />

      {/* Live Preview */}
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">Preview</Typography>
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>{title || 'Untitled'}</Typography>

        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {previewBody}
        </ReactMarkdown>
      </Box>

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
