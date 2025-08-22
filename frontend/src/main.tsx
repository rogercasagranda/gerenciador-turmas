// frontend/src/main.tsx

import './styles/theme.css';
import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { loadThemeFromStorage } from './utils/theme';
import './index.css';
import './styles/Layout.css';
import ErrorBoundary from './components/ErrorBoundary';

loadThemeFromStorage();

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Elemento #root não encontrado');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
        <HashRouter basename={import.meta.env.BASE_URL}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </HashRouter>
      </GoogleOAuthProvider>
    </React.StrictMode>,
  );
}


// Register service worker after page load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      return Promise.all(regs.map((r) => r.unregister()));
    }).finally(() => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
    });
  });
}

