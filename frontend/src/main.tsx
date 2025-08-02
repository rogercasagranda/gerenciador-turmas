// frontend/src/main.tsx

// Importa o React
import React from 'react';

// Importa o método de renderização
import ReactDOM from 'react-dom/client';

// Importa o componente principal da aplicação
import App from './App';

// Importa o BrowserRouter para rotas
import { BrowserRouter } from 'react-router-dom';

// Importa o GoogleOAuthProvider para permitir uso do GoogleLogin
import { GoogleOAuthProvider } from '@react-oauth/google';

// Renderiza o App dentro dos providers
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="814897966731-04dg7jco1httj5ngo1gbei3gmc39uhih.apps.googleusercontent.com">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
