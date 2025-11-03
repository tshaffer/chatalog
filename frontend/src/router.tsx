// src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';
import Home from './pages/Home';
import Notes from './pages/Notes';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },              // ✅ no redirect here
      { path: 'home', element: <Home /> },             // optional
      { path: 's', element: <Notes /> },
      { path: 's/:subjectSlug', element: <Notes /> },
      { path: 's/:subjectSlug/t/:topicSlug', element: <Notes /> },
      { path: 's/:subjectSlug/t/:topicSlug/n/:noteSlug', element: <Notes /> },
      { path: '*', element: <div style={{padding:16}}>Not found (inside AppShell)</div> },
    ],
  },
  { path: '*', element: <div style={{padding:16}}>Not found</div> },
]);
