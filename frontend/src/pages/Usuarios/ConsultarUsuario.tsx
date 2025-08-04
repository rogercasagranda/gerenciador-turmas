// frontend/src/pages/Usuarios/ConsultarUsuario.tsx

// Importa o React e hooks para controle de estado e ciclo de vida
import React, { useEffect, useState } from 'react';

// Importa biblioteca para requisições HTTP
import axios from 'axios';

// Importa o CSS exclusivo da tela de consulta
import "../../styles/ConsultarUsuario.css";

// Define a estrutura de dados esperada do backend
interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo_perfil: string;
  numero_celular: string;
  ddi: string;
  ddd: string;
}

// Define o componente funcional da tela
const ConsultarUsuario: React.FC = () => {
  // Estado para armazenar os usuários retornados do backend
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Estado para armazenar possíveis mensagens de erro
  const [erro, setErro] = useState('');

  // useEffect executa a chamada à API quando o componente for carregado
  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        // Faz requisição GET para o backend
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios`);
        setUsuarios(response.data); // Atualiza o estado com os usuários recebidos
      } catch (err: any) {
        setErro(err.response?.data?.detail || 'Erro ao buscar usuários.');
      }
    };

    carregarUsuarios(); // Executa a função
  }, []);

  return (
    <div className="consulta-container">
      <h2>Usuários Cadastrados</h2>

      {/* Exibe erro, se houver */}
      {erro && <p className="erro">{erro}</p>}

      {/* Tabela de usuários */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Celular</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id_usuario}>
              <td>{usuario.id_usuario}</td>
              <td>{usuario.nome}</td>
              <td>{usuario.email}</td>
              <td>{usuario.tipo_perfil}</td>
              <td>{`+${usuario.ddi} (${usuario.ddd}) ${usuario.numero_celular}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConsultarUsuario;
