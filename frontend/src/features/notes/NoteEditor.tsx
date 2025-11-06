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
// helpers
function toBlockquote(s: string): string {
  return s.split('\n').map(line => `> ${line}`).join('\n');
}
function unescapeEscapes(s: string): string {
  return s
    .replace(/\\\\/g, '\\')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

// DROP-IN
function normalizeTurns(md: string): string {
  const reBlock = /:::turns\s*([\s\S]*?)(?:^\s*:::end-turns\s*$|^\s*:::\s*$|\Z)/gim;
  return md.replace(reBlock, (_m, body: string) => {
    const turns = scanYamlTurns(body);
    if (!turns.length) return '';
    const out: string[] = [];
    for (const t of turns) {
      if ((t.role || '').toLowerCase() === 'user') {
        out.push('**Prompt**', '', toBlockquote(t.text), '');
      } else {
        out.push('**Response**', '', t.text, '');
      }
    }
    return out.join('\n').trim() + '\n';
  });
}

type Turn = { role: string; text: string };

function scanYamlTurns(block: string): Turn[] {
  const s = block;
  const len = s.length;
  let i = 0;
  const turns: Turn[] = [];
  let role: string | null = null;

  const isWord = (c: string) => /[A-Za-z0-9_-]/.test(c);

  while (i < len) {
    while (i < len && /\s/.test(s[i])) i++;
    if (s[i] === '-') { i++; while (i < len && /\s/.test(s[i])) i++; }

    if (matchAt(s, i, 'role:')) {
      i += 5;
      while (i < len && /\s/.test(s[i])) i++;
      const start = i;
      while (i < len && isWord(s[i])) i++;
      role = s.slice(start, i).toLowerCase();
      continue;
    }

    if (matchAt(s, i, 'text:')) {
      i += 5;
      while (i < len && /\s/.test(s[i])) i++;
      if (s[i] !== '"') { while (i < len && s[i] !== '\n') i++; continue; }
      i++; // opening "

      let buf = '';
      let escaped = false;
      for (; i < len; i++) {
        const ch = s[i];
        if (escaped) { buf += ch; escaped = false; }
        else if (ch === '\\') { buf += ch; escaped = true; }
        else if (ch === '"') { i++; break; }
        else { buf += ch; }
      }

      const text = unescapeEscapes(buf);
      if (role == null || role === '') {
        turns.push({ role: 'assistant', text });
      } else {
        turns.push({ role, text });
        role = null;
      }
      continue;
    }

    while (i < len && s[i] !== '\n') i++;
    if (i < len && s[i] === '\n') i++;
  }

  return turns;
}

function matchAt(s: string, i: number, lit: string): boolean {
  for (let k = 0; k < lit.length; k++) if (s[i + k] !== lit[k]) return false;
  return true;
}









// --- helpers you likely already have ---
function stripFrontMatter(md: string | undefined): string {
  if (!md) return '';
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}
/** Robust parser for YAML-style items:
 *   - role: user
 *     text: "<quoted text possibly with \\n and \\" and newlines>"
 */
function parseTurnsYaml(block: string): Array<{ role: string; text: string }> {
  const lines = block.split(/\r?\n/);
  const turns: Array<{ role: string; text: string }> = [];

  let pendingRole: string | null = null;
  let collecting = false;
  let buf = '';

  // helper to finalize a turn when we have both role and text
  const pushIfReady = () => {
    if (pendingRole != null) {
      turns.push({ role: pendingRole, text: unescapeEscapes(buf) });
    }
    pendingRole = null;
    buf = '';
    collecting = false;
  };

  // scan line-by-line and read quoted text with escape awareness
  for (let li = 0; li < lines.length; li++) {
    const raw = lines[li];

    if (!collecting) {
      // role: <word>
      const mRole = raw.match(/^\s*-\s*role:\s*(\w+)\s*$/i) || raw.match(/^\s*role:\s*(\w+)\s*$/i);
      if (mRole) {
        pendingRole = mRole[1].toLowerCase();
        continue;
      }

      // text: "<start..."
      const mTextStart = raw.match(/^\s*text:\s*"(.*)$/i);
      if (mTextStart) {
        const rest = mTextStart[1];
        // try to find a closing " in this same line (unescaped)
        const { consumed, closed } = readQuotedTillClose(rest);
        buf = consumed;
        collecting = !closed; // if not closed, keep collecting next lines
        if (!collecting) {
          // finished text on same line
          pushIfReady();
        }
        continue;
      }
      // ignore other lines inside the block
    } else {
      // we are collecting continuation of text, append newline + this line and try to close
      const { consumed, closed } = readQuotedTillClose('\n' + raw);
      buf += consumed;
      if (closed) {
        pushIfReady();
      }
    }
  }

  // If file ended while collecting, still push
  if (collecting) pushIfReady();

  return turns;
}

/** Reads characters until an unescaped closing quote is found.
 * Input starts right after the opening quote; may start with '\n...' when continuing.
 * Returns the consumed content and whether we closed.
 */
function readQuotedTillClose(s: string): { consumed: string; closed: boolean } {
  let out = '';
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escaped) {
      out += ch;
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
      // keep the backslash so unescapeEscapes() can handle it
      out += ch;
    } else if (ch === '"') {
      // closing quote reached
      return { consumed: out, closed: true };
    } else {
      out += ch;
    }
  }
  // not closed yet; return everything
  return { consumed: out, closed: false };
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

  // --- BEGIN TURN PREPROCESSOR SELF-TEST ---
const testMarkdown = String.raw`:::turns
- role: user
  text: "Still testing chatalog rendering. Respond with a short snippet that includes some markdown that will test the escaping mechanism of chatalog."
- role: assistant
  text: "Here’s a compact markdown snippet that stresses escaping and directive parsing:\n## Escaping Test\n\n- Literal colons: \`::\`\n- Directive-like but should render as text: :::note *not a block*\n- Inline code with backticks: \`\` \`code\` \`\`\n- Triple backticks inside a fenced block:\n\n\nnginxCopy codenested\n\nyamlCopy code- YAML front matter imitation:\n---\ntitle: \"fake front matter --- inside content\"\n---\n- Markdown link with brackets: [link](https://example.com)\n- Mixed emphasis: **bold _and_ italic**\n\nThis snippet mixes fence nesting, ::: sequences, and front-matter–style separators — all good for testing Chatalog’s preprocessing and escaping logic."
- role: user
  text: "Now give me two sentences with small formatting."
- role: assistant
  text: "Here’s a compact sample:\nThis is **bold text** with some *italics* and inline \`code\`.\nHere’s a [link](https://example.com) and an emoji 😊 to test inline rendering."
:::end-turns`;

const __probe = normalizeTurns(stripFrontMatter(testMarkdown));
console.log('[turns probe length]', __probe.length);
console.log('[turns probe contains "fake front matter"]', __probe.includes('fake front matter'));
console.log('[turns probe tail]', __probe.slice(__probe.indexOf('title:'), __probe.indexOf('title:') + 80));
// --- END TURN PREPROCESSOR SELF-TEST ---

  // >>> Preprocess here
  // const previewBody = normalizeTurns(stripFrontMatter(markdown));
  const previewBody = normalizeTurns(stripFrontMatter(testMarkdown));
  console.log('[normalizeTurns OUTPUT]\\n', previewBody);

  // debugger;

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
