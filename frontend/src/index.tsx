import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getNotesSample } from './api/client';
import type { NotePreview } from '../../shared/src/types';

function App() {
  const [data, setData] = useState<NotePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErr(null);
    try {
      const sample = await getNotesSample();
      setData(sample);
    } catch (e: any) {
      setErr(e?.message ?? 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Chatalog</h1>
      <button onClick={handleClick} disabled={loading} style={{ padding: '8px 12px', cursor: 'pointer' }}>
        {loading ? 'Loading…' : 'Fetch sample note'}
      </button>

      {err && (
        <div style={{ color: 'crimson', marginTop: 12 }}>
          Error: {err}
        </div>
      )}

      {data && (
        <pre style={{ marginTop: 12, background: '#f7f7f7', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
{JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

const container = document.getElementById('root')!;
createRoot(container).render(<App />);
