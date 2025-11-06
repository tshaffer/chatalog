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

import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeHighlight from 'rehype-highlight';
import { visit } from 'unist-util-visit';

// ---------------- helpers ----------------

function stripFrontMatter(md: string | undefined): string {
  if (!md) return '';
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function nodeToString(node: any): string {
  let out = '';
  visit(node, (n: any) => {
    if (n.type === 'text' && typeof n.value === 'string') out += n.value;
  });
  return out.trim();
}

// Unescape common sequences from serialized text
function unescapeEscapes(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

type Turn = { role: string; text: string };

/**
 * remark plugin:
 *   :::turns
 *   - "role: user text: "...""
 *   - "role: assistant text: "...""
 *   :::
 *
 * → <div class="turns" data-turns-json='[{"role":"user","text":"..."}]'></div>
 * We remove list markup so we can render clean, top-level blocks later.
 */
function turnsDirectivePlugin() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (node.type !== 'containerDirective' || node.name !== 'turns') return;

      // Get all plain text inside the :::turns block (paragraphs joined with \n)
      const raw = nodeToString({ type: 'root', children: node.children ?? [] });

      // Remove any trailing ":::end-turns" or stray ::: markers
      const cleaned = raw.replace(/^\s*:::end-turns\s*$/m, '').replace(/^\s*:::\s*$/m, '');

      // Find repeated pairs: role: <word>  ...  text: "<...>"
      // Note: we do NOT require a leading "-" and we allow anything in between.
      const re = /role:\s*(\w+)[^\S\r\n]*[\r\n]+[\t ]*text:\s*"([\s\S]*?)"/gi;

      const turns: { role: string; text: string }[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(cleaned)) !== null) {
        const role = (m[1] || '').toLowerCase();
        const text = unescapeEscapes(m[2] || '');
        turns.push({ role, text });
      }

      // Replace original children with wrapper carrying serialized turns
      node.children = []; // prevent default list rendering
      node.data ||= {};
      node.data.hName = 'div';
      node.data.hProperties = {
        ...(node.data.hProperties || {}),
        className: ['turns'],
        'data-turns-json': JSON.stringify(turns),
      };
    });
  };
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

  const noteKey = note?.id;
  useEffect(() => {
    if (!note) return;
    latestNoteRef.current = note;
    setTitle(note.title ?? '');
    setMarkdown(note.markdown ?? '');
    setDirty(false);
  }, [noteKey]);

  // debounced autosave
  useEffect(() => {
    if (!note || !dirty) return;
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
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
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

  // before-unload guard
  useEffect(() => {
    if (!enableBeforeUnloadGuard) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
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
  if (isLoading || !note) return <Box p={2}><Typography>Loading…</Typography></Box>;

  const previewBody = stripFrontMatter(markdown);

  const components: Components = {
    // Render the whole transcript as blocks, not list items
    div({ node, ...props }) {
      const className = (props.className ?? '').toString();
      if (!className.split(/\s+/).includes('turns')) return <div {...props} />;

      const json = (props as any)['data-turns-json'] as string | undefined;
      let turns: Turn[] = [];
      try {
        turns = json ? JSON.parse(json) : [];
      } catch {
        // fall through to default wrapper if bad JSON
        return <div {...props} />;
      }

      // Render Prompt (as blockquote) and Response (full markdown at root)
      return (
        <Box sx={{ my: 2 }}>
          {turns.map((t, i) => {
            const role = t.role.toLowerCase();
            if (role === 'user') {
              return (
                <Box key={i} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Prompt</Typography>
                  <blockquote style={{ margin: 0 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {t.text}
                    </ReactMarkdown>
                  </blockquote>
                </Box>
              );
            }
            // assistant or anything else → render as pure root-level markdown
            return (
              <Box key={i} sx={{ my: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Response</Typography>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {t.text}
                </ReactMarkdown>
              </Box>
            );
          })}
        </Box>
      );
    },
  };

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

        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkDirective, turnsDirectivePlugin]}
          rehypePlugins={[rehypeHighlight]}
          components={components}
        >
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
``