// frontend/src/main.tsx

import './styles/theme.css';
import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { loadThemeFromStorage } from './utils/theme';
import './index.css';
import './styles/Layout.css';

// Lê o Client ID do Google via .env
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

loadThemeFromStorage();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

// Registro do Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

