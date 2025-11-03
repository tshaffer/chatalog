import React from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

import { fetchSampleNote, clearSample } from '../features/notes/notesSlice';
import { useAppDispatch, useAppSelector } from '../store';

export default function Notes() {
  const dispatch = useAppDispatch();
  const { sample, status, error } = useAppSelector(s => s.notes);

  const loading = status === 'loading';

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button onClick={() => dispatch(fetchSampleNote())} disabled={loading} variant="contained" sx={{ mr: 1 }}>
        {loading ? 'Loading…' : 'Fetch sample note'}
      </Button>
      <Button onClick={() => dispatch(clearSample())} disabled={loading} variant="outlined">
        Clear
      </Button>

      {sample && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>{sample.title}</Typography>
          {sample.summary && (
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {sample.summary}
            </Typography>
          )}
          <Box component="pre" sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, overflowX: 'auto' }}>
            {JSON.stringify(sample, null, 2)}
          </Box>
        </Paper>
      )}
    </>
  );
}
