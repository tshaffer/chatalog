import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import { theme } from './theme';
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chatalog
          </Typography>
          <Button
            color="inherit"
            onClick={handleClick}
            disabled={loading}
            variant="outlined"
            sx={{ bgcolor: 'rgba(255,255,255,0.08)' }}
          >
            {loading ? 'Loading…' : 'Fetch sample note'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {err && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {err}
          </Alert>
        )}

        {data ? (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {data.title}
            </Typography>
            {data.summary && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {data.summary}
              </Typography>
            )}
            <Box
              component="pre"
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                overflowX: 'auto'
              }}
            >
              {JSON.stringify(data, null, 2)}
            </Box>
          </Paper>
        ) : (
          <Typography color="text.secondary">
            Click “Fetch sample note” to load an example response from the backend.
          </Typography>
        )}
      </Container>
    </ThemeProvider>
  );
}

const container = document.getElementById('root')!;
createRoot(container).render(<App />);
