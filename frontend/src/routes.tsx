import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';
import Home from './pages/Home';
import Notes from './pages/Notes';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'notes', element: <Notes /> }
    ]
  }
]);
