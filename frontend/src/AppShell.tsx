// chatalog/client/src/AppShell.tsx
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Button, Stack } from '@mui/material';

export default function AppShell() {
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    pathname === to ||
    (to === '/s' && pathname.startsWith('/s')) ||
    (to === '/' && (pathname === '/' || pathname === '/home'));

  return (
    <>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chatalog
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button component={Link} to="/" color="inherit" variant={isActive('/') ? 'outlined' : 'text'}>
              Home
            </Button>
            <Button component={Link} to="/s" color="inherit" variant={isActive('/s') ? 'outlined' : 'text'}>
              Notes
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </>
  );
}
