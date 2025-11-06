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

// Strip YAML front matter before previewing
function stripFrontMatter(md: string | undefined): string {
  if (!md) return '';
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

// Minimal "toString" for mdast nodes so we can read a list item's raw text
function nodeToString(node: any): string {
  let out = '';
  visit(node, (n: any) => {
    if (n.type === 'text' && typeof n.value === 'string') out += n.value;
  });
  return out.trim();
}

/**
 * remark plugin to transform:
 *
 * :::turns
 * - "role: user text: "Hello""
 * - "role: assistant text: "Hi""
 * :::
 *
 * into a normal <div class="turns"> ... </div>, and annotate each list item
 * with parsed role/text. This keeps us within react-markdown’s typed Components.
 */
function turnsDirectivePlugin() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (node.type === 'containerDirective' && node.name === 'turns') {
        // render as a div with a special class we can detect later
        node.data ||= {};
        node.data.hName = 'div';
        node.data.hProperties = { ...(node.data.hProperties || {}), className: ['turns'] };

        // annotate inner list items so we can render "Role: text"
        visit(node, 'listItem', (li: any) => {
          li.data ||= {};
          li.data.turnsItem = true;

          const raw = nodeToString(li);
          // Try to parse: role: user text: "...."
          const m = raw.match(/role:\s*(\w+)\s+text:\s*"([\s\S]*?)"\s*$/i);
          if (m) {
            li.data.role = m[1].toLowerCase();
            li.data.turnText = m[2];
          } else {
            li.data.turnText = raw.replace(/^-\s*/, '');
          }
        });
      }
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

  // Load note -> form (use a stable key to avoid infinite loops)
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

  // Before-unload guard
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

  // Typed, conditional component overrides
  const components: Components = {
    // If a <div> carries class 'turns', wrap it with a label.
    div({ node, ...props }) {
      const className = (props.className ?? '').toString();
      if (className.split(/\s+/).includes('turns')) {
        return (
          <Box sx={{ borderLeft: '4px solid', pl: 2, my: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Transcript</Typography>
            <div {...props} />
          </Box>
        );
      }
      return <div {...props} />;
    },

    // For list items inside :::turns, we tagged them in data.turnsItem
    li({ node, ...props }) {
      const data = (node as any).data;
      if (data?.turnsItem) {
        const role =
          data.role === 'assistant' ? 'Assistant' :
          data.role === 'user' ? 'User' :
          (data.role ? String(data.role) : 'Role');
        const text = data.turnText ?? '';
        return (
          <li {...props}>
            <strong>{role}:</strong> {text}
          </li>
        );
      }
      return <li {...props} />;
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
