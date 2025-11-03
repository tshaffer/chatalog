import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Button, Stack } from '@mui/material';

export default function AppShell() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname === to;

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
            <Button component={Link} to="/notes" color="inherit" variant={isActive('/notes') ? 'outlined' : 'text'}>
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
