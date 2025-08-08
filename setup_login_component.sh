#!/bin/bash

# Garantir que está no diretório do frontend
cd frontend

echo "🧼 Limpando componentes antigos..."
rm -rf src/components
mkdir -p src/components
mkdir -p src/styles

echo "📄 Criando Login.tsx..."
cat > src/components/Login.tsx << 'EOF'
import React from 'react';
import '../styles/Login.css';

const Login: React.FC = () => {
  return (
    <div className="login-container">
      <form className="login-form">
        <h2 className="login-title">Bem-vindo</h2>
        <input type="text" placeholder="Usuário" className="login-input" />
        <input type="password" placeholder="Senha" className="login-input" />
        <button type="submit" className="login-button">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
EOF

echo "🎨 Criando Login.css com roxo suave e verde manjericão..."
cat > src/styles/Login.css << 'EOF'
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to right, #d7f8d7, #e6dbf7); /* manjericão e roxo claro */
  font-family: 'Segoe UI', sans-serif;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 350px;
}

.login-title {
  margin-bottom: 20px;
  color: #5e3796; /* roxo suave */
}

.login-input {
  display: block;
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.login-button {
  background-color: #7bbf5e; /* manjericão */
  color: white;
  padding: 12px;
  width: 100%;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-button:hover {
  background-color: #68a94e;
}
EOF

echo "✅ Tudo pronto! Agora vá em src/App.tsx e importe o Login:"
echo "import Login from './components/Login';"
echo "E coloque <Login /> no lugar de qualquer conteúdo atual no return."
