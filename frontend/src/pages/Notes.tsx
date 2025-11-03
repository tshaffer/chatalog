// src/pages/Notes.tsx
import React, { useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import Sidebar from '../components/Sidebar';
import MainArea from '../components/MainArea';
import ResizeHandle from '../components/ResizeHandle';
import { usePersistentState } from '../hooks/usePersistentState';

const MIN_SIDEBAR = 220;
const MAX_SIDEBAR = 480;
const DEFAULT_SIDEBAR = 300;

export default function Notes() {
  const [sidebarWidth, setSidebarWidth] = usePersistentState<number>(
    'ui.sidebarWidth',
    DEFAULT_SIDEBAR
  );

  const onDrag = useCallback(
    (dx: number) => {
      setSidebarWidth((w) => {
        const next = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, w + dx));
        return next;
      });
    },
    [setSidebarWidth]
  );

  return (
    <Box
      display="grid"
      gridTemplateColumns={`${sidebarWidth}px 6px 1fr`}
      height="calc(100vh - 64px)" // subtract AppBar; tweak if your AppBar height differs
    >
      <Paper variant="outlined" square sx={{ p: 1, overflow: 'auto' }}>
        <Sidebar />
      </Paper>

      <ResizeHandle
        aria-label="Resize sidebar"
        onDrag={onDrag}
        style={{}}
      />

      <Box sx={{ overflow: 'hidden' }}>
        <MainArea />
      </Box>
    </Box>
  );
}
