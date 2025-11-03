// chatalog/client/src/pages/Notes.tsx
import React from 'react';
import { Box, Paper } from '@mui/material';
import Sidebar from '../components/Sidebar';
import MainArea from '../components/MainArea';

export default function Notes() {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: '1fr', md: '300px 1fr' }}
      height="100vh"
    >
      <Paper variant="outlined" square sx={{ p: 1, overflow: 'auto' }}>
        <Sidebar />
      </Paper>

      <Box sx={{ overflow: 'hidden' }}>
        <MainArea />
      </Box>
    </Box>
  );
}
