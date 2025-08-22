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

loadThemeFromStorage();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="814897966731-04dg7jco1httj5ngo1gbei3gmc39uhih.apps.googleusercontent.com">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
