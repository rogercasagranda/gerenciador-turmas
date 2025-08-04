// frontend/src/pages/Usuarios/CadastrarUsuario.tsx

// Importa o React e o hook de estado
import React, { useState } from 'react';

// Importa o axios para requisições HTTP
import axios from 'axios';

// Importa o hook de navegação do React Router (não encapsula com <Router>)
import { useNavigate } from 'react-router-dom';

// Importa o estilo CSS exclusivo da tela de cadastro
import "../../styles/CadastrarUsuario.css";

// Define o componente principal
const CadastrarUsuario: React.FC = () => {
  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [perfil, setPerfil] = useState('');
  const [ddi, setDdi] = useState('55');
  const [ddd, setDdd] = useState('54');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [loginGoogle, setLoginGoogle] = useState(false);
  const [erro, setErro] = useState('');

  // Hook para redirecionamento após cadastro
  const navigate = useNavigate();

  // Função chamada ao enviar o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de campos obrigatórios
    if (!nome || !email || !senha || !confirmarSenha || !perfil || !numeroCelular) {
      setErro('Todos os campos são obrigatórios.');
      return;
    }

    // Validação de senha
    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      // Requisição POST para o backend
      await axios.post(`${import.meta.env.VITE_API_URL}/usuarios`, {
        nome,
        email,
        senha,
        tipo_perfil: perfil,
        ddi,
        ddd,
        numero_celular: numeroCelular,
        google_id: loginGoogle ? 'google-login' : null
      });

      // Alerta de sucesso e redirecionamento
      alert('Usuário cadastrado com sucesso!');
      navigate('/');
    } catch (err: any) {
      // Captura erro de API
      setErro(err.response?.data?.detail || 'Erro ao cadastrar usuário.');
    }
  };

  // Retorna o JSX do formulário
  return (
    <div className="cadastro-container">
      <form className="cadastro-form" onSubmit={handleSubmit}>
        <h2>Cadastrar Usuário</h2>

        <label>Nome:</label>
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />

        <label>E-mail:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Senha:</label>
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />

        <label>Confirmar Senha:</label>
        <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />

        <label>Perfil:</label>
        <select value={perfil} onChange={(e) => setPerfil(e.target.value)} required>
          <option value="">Selecione</option>
          <option value="diretor">Diretor</option>
          <option value="secretaria">Secretaria</option>
          <option value="coordenador">Coordenador/SOE</option>
          <option value="professor">Professor</option>
          <option value="responsavel">Responsável</option>
        </select>

        <label>DDI:</label>
        <select value={ddi} onChange={(e) => setDdi(e.target.value)} required>
          <option value="55">+55 (Brasil)</option>
          <option value="1">+1 (EUA)</option>
        </select>

        <label>DDD:</label>
        <select value={ddd} onChange={(e) => setDdd(e.target.value)} required>
          <option value="54">54</option>
          <option value="11">11</option>
        </select>

        <label>Celular:</label>
        <input type="text" value={numeroCelular} onChange={(e) => setNumeroCelular(e.target.value)} required />

        <label>
          <input
            type="checkbox"
            checked={loginGoogle}
            onChange={(e) => setLoginGoogle(e.target.checked)}
          />
          Login via Google
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
};

// Exporta o componente principal
export default CadastrarUsuario;
