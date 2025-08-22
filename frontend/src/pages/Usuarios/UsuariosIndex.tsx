// Importa React e navegação
import React from 'react';
import useBaseNavigate from '@/hooks/useBaseNavigate'

// Importa o CSS compartilhado
import '../../styles/Usuarios.css';

// Tela principal da rota /usuarios com botões de acesso
const UsuariosIndex: React.FC = () => {
  const navigate = useBaseNavigate();

  return (
    <div className="usuario-container">
      <h2>Gerenciar Usuários</h2>

      <div className="usuario-botoes">
        <button className="button" onClick={() => navigate('/usuarios/cadastrar')}>
          ➕ Cadastrar Usuário
        </button>

        <button className="button" onClick={() => navigate('/usuarios/consultar')}>
          🔍 Consultar Usuários
        </button>
      </div>
    </div>
  );
};

export default UsuariosIndex;
