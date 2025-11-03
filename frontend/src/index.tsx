import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';

import { theme } from './theme';
import { router } from './routes';
import { store } from './store';

function Root() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  );
}

const container = document.getElementById('root')!;
createRoot(container).render(<Root />);
