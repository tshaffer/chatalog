import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

import { getNotesSample } from '../api/client';
import type { NotePreview } from '../../../shared/src/types';

export default function Notes() {
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
    <>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Button onClick={handleClick} disabled={loading} variant="contained">
        {loading ? 'Loading…' : 'Fetch sample note'}
      </Button>

      {data && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>{data.title}</Typography>
          {data.summary && (
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {data.summary}
            </Typography>
          )}
          <Box component="pre" sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, overflowX: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </Box>
        </Paper>
      )}
    </>
  );
}
