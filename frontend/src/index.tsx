import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <div style={{ padding: 16 }}>Hello, Chatalog 👋</div>;
}

const container = document.getElementById('root')!;
createRoot(container).render(<App />);
