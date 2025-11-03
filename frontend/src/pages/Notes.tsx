import React from 'react';
import { Grid, Paper, Typography, Box, Alert } from '@mui/material';
import HierarchySidebar from '../components/HierarchySidebar';
import { MOCK_HIERARCHY } from '../mock/hierarchy';
import { fetchSampleNote, clearSample, selectNotesState } from '../features/notes/notesSlice';
import { useAppDispatch, useAppSelector } from '../store';

export default function Notes() {
  const dispatch = useAppDispatch();
  const { sample, status, error } = useAppSelector(selectNotesState);
  const loading = status === 'loading';

  function handleSelectNote() {
    // For now, selecting any note triggers the sample fetch (placeholder)
    if (!loading) dispatch(fetchSampleNote());
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4} lg={3}>
        <Paper variant="outlined" sx={{ p: 1 }}>
          <HierarchySidebar data={MOCK_HIERARCHY} onSelectNote={handleSelectNote} />
        </Paper>
      </Grid>

      <Grid item xs={12} md={8} lg={9}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper variant="outlined" sx={{ p: 2, minHeight: 280 }}>
          {sample ? (
            <>
              <Typography variant="h6" gutterBottom>{sample.title}</Typography>
              {sample.summary && (
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {sample.summary}
                </Typography>
              )}
              <Box component="pre" sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, overflowX: 'auto' }}>
                {JSON.stringify(sample, null, 2)}
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => dispatch(clearSample())}
                >
                  Clear
                </Typography>
              </Box>
            </>
          ) : (
            <Typography color="text.secondary">
              Select a note from the left to load an example detail (currently the sample endpoint).
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
