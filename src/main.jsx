import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Register the SW only in production. In dev it caches the Vite modules and
// serves stale code on reload, which masks fixes and looks like the app is
// "stuck" on old behaviour.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => console.warn('SW registration failed:', err));
  });

  // The new SW activates immediately (skipWaiting) and deletes the old build's
  // caches, so a page still running the old bundle can no longer lazy-load its
  // own chunks (e.g. Progress-<hash>.js) — navigation breaks until refresh.
  // Reload once when a NEW SW takes over; skip the very first install.
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) window.location.reload();
    hadController = true;
  });
} else if ('serviceWorker' in navigator) {
  // Dev: unregister any SW left over from before registration was gated to
  // production, otherwise it keeps serving stale Vite modules on reload.
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
