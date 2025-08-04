// frontend/src/pages/Home.tsx

import React, { useState } from 'react';
import { FaHome, FaUsers, FaChalkboardTeacher, FaCogs, FaBell, FaUser } from 'react-icons/fa';
import { BsBook } from 'react-icons/bs';
import { BiBarChart } from 'react-icons/bi';
import CadastrarUsuario from "./Usuarios/CadastrarUsuario";
import ConsultarUsuario from "./Usuarios/ConsultarUsuario";
import MainContent from "../components/MainContent";

const Home: React.FC = () => {
  const [conteudoAtual, setConteudoAtual] = useState<React.ReactNode>(<></>);
  const [menuUsuariosAberto, setMenuUsuariosAberto] = useState(false);

  return (
    <div>
      <header style={{ backgroundColor: '#5e17eb', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', fontSize: '20px' }}>Portal do Professor</span>
          <span style={{ cursor: 'pointer' }}><FaHome /> Início</span>
          <span style={{ cursor: 'pointer' }}><BsBook /> Turmas</span>
          <span style={{ cursor: 'pointer' }}><FaChalkboardTeacher /> Professores</span>
          <span style={{ cursor: 'pointer' }}><BiBarChart /> Relatórios</span>
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setMenuUsuariosAberto(true)}
            onMouseLeave={() => setMenuUsuariosAberto(false)}
          >
            <span style={{ cursor: 'pointer' }}>
              <FaUsers /> Usuários ▾
            </span>
            {menuUsuariosAberto && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: '#fff',
                color: '#000',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                borderRadius: '6px',
                zIndex: 999
              }}>
                <div
                  style={{ padding: '10px 15px', cursor: 'pointer' }}
                  onClick={() => setConteudoAtual(<CadastrarUsuario />)}
                >
                  Cadastrar
                </div>
                <div
                  style={{ padding: '10px 15px', cursor: 'pointer' }}
                  onClick={() => setConteudoAtual(<ConsultarUsuario />)}
                >
                  Consultar
                </div>
              </div>
            )}
          </div>
          <span style={{ cursor: 'pointer' }}><FaCogs /> Configurações</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <FaBell />
          <FaUser />
        </div>
      </header>

      <MainContent>
        {conteudoAtual}
      </MainContent>

      <footer style={{ textAlign: 'center', padding: '10px', fontSize: '13px', color: '#666' }}>
        © 2025 Portal do Professor - Todos os direitos reservados
      </footer>
    </div>
  );
};

export default Home;
