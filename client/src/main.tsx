import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const normalizeHashRoute = () => {
  const { origin, pathname, search, hash } = window.location;
  if (hash || pathname === '/' || pathname === '/index.html') return;
  window.location.replace(`${origin}/#${pathname}${search}`);
};

normalizeHashRoute();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
