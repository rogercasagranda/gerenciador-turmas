// Importa React e hooks necessários
import React, { useEffect, useMemo, useState } from 'react'
// Importa axios para comunicação HTTP
import axios from 'axios'
// Importa o CSS dedicado desta tela
import '../../styles/ConsultarUsuario.css'

// Define o tipo mínimo do usuário para exibição
type Usuario = { // Declara o shape usado na tabela
  id: number // Identificador do usuário
  nome: string // Nome do usuário
  email: string // E-mail do usuário
  tipo_perfil: string // Perfil do usuário
  ddi: string // DDI do telefone
  ddd: string // DDD do telefone
  numero_celular: string // Número do celular
}

// Define o componente funcional de consulta
const ConsultarUsuario: React.FC = () => {
  // Define estado para a lista de usuários
  const [usuarios, setUsuarios] = useState<Usuario[]>([]) // Armazena os itens da tabela
  // Define estado de loading
  const [carregando, setCarregando] = useState<boolean>(false) // Indica carregamento
  // Define estado de erro
  const [erro, setErro] = useState<string>('') // Guarda mensagens de erro
  // Define estado do filtro de busca
  const [busca, setBusca] = useState<string>('') // Controla texto do filtro

  // Define a base da API via variável de ambiente (ou fallback)
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000' // Define endpoint base

  // Busca usuários ao montar o componente
  useEffect(() => {
    // Inicia o carregamento
    setCarregando(true) // Ativa indicador de carregamento
    // Limpa erro prévio
    setErro('') // Reseta mensagem de erro

    // Prepara headers com token, se houver
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') // Lê token da sessão
    const headers: Record<string, string> = {} // Inicializa objeto vazio
    if (token) headers['Authorization'] = `Bearer ${token}` // Inclui token no header

    // Executa requisição GET
    axios.get<Usuario[]>(`${API_BASE}/usuarios`, { headers }) // Chama endpoint de listagem
      .then((res) => { // Trata sucesso
        setUsuarios(res.data || []) // Grava a lista retornada
      })
      .catch((err) => { // Trata erro
        const msg = err?.response?.data?.detail || 'Falha ao carregar usuários.' // Extrai detalhe
        setErro(msg) // Exibe mensagem ao usuário
      })
      .finally(() => { // Finaliza a operação
        setCarregando(false) // Desativa indicador de carregamento
      })
  }, [API_BASE]) // Executa apenas na montagem

  // Calcula lista filtrada conforme o termo de busca
  const usuariosFiltrados = useMemo(() => {
    // Normaliza termo de busca
    const q = busca.trim().toLowerCase() // Converte para minúsculas
    // Retorna toda a lista quando não há filtro
    if (!q) return usuarios // Evita processamento desnecessário
    // Aplica filtro por nome, e-mail ou perfil
    return usuarios.filter((u) => { // Aplica a função de filtro
      return ( // Retorna verdadeiro quando houver match
        u.nome.toLowerCase().includes(q) || // Confere nome
        u.email.toLowerCase().includes(q) || // Confere e-mail
        (u.tipo_perfil || '').toLowerCase().includes(q) // Confere perfil
      ) // Fecha condição de filtro
    }) // Fecha filter
  }, [busca, usuarios]) // Recalcula quando busca ou lista mudam

  // Renderiza a interface da tela de consulta
  return (
    <div className="consulta-wrapper">{/* Cria contêiner principal */}
      <div className="consulta-topo">{/* Agrupa título e buscador */}
        <h2 className="consulta-titulo">{/* Exibe título da página */}
          Consultar Usuários{/* Texto do título */}
        </h2>
        <input
          className="buscador" // Aplica estilo do campo de busca
          type="search" // Define tipo de pesquisa
          placeholder="Buscar por nome, e-mail ou perfil..." // Dica de busca
          value={busca} // Liga ao estado controlado
          onChange={(e) => setBusca(e.target.value)} // Atualiza termo
        />{/* Fecha input */}
      </div>{/* Fecha barra superior */}

      {/* Exibe erro quando existir */}
      {erro && <div className="alerta erro">{erro}</div>}{/* Mostra alerta de erro */}

      {/* Exibe indicador de carregamento quando ativo */}
      {carregando && <div className="carregando">Carregando...</div>}{/* Mostra loading */}

      {/* Renderiza tabela apenas quando não está carregando */}
      {!carregando && (
        <div className="tabela-container">{/* Cria contêiner com rolagem horizontal */}
          <table className="tabela">{/* Declara tabela estilizada */}
            <thead>{/* Declara cabeçalho da tabela */}
              <tr>{/* Declara linha de cabeçalho */}
                <th>Nome</th>{/* Coluna de nome */}
                <th>E-mail</th>{/* Coluna de e-mail */}
                <th>Perfil</th>{/* Coluna de perfil */}
                <th>Telefone</th>{/* Coluna de telefone */}
              </tr>{/* Fecha linha */}
            </thead>{/* Fecha cabeçalho */}
            <tbody>{/* Declara corpo da tabela */}
              {usuariosFiltrados.map((u) => ( // Itera sobre a lista filtrada
                <tr key={u.id}>{/* Cria linha única por usuário */}
                  <td>{u.nome}</td>{/* Exibe nome */}
                  <td>{u.email}</td>{/* Exibe e-mail */}
                  <td>{u.tipo_perfil}</td>{/* Exibe perfil */}
                  <td>{`+${u.ddi} (${u.ddd}) ${u.numero_celular}`}</td>{/* Formata telefone */}
                </tr> // Fecha linha da tabela
              ))}{/* Encerra map */}
              {usuariosFiltrados.length === 0 && ( // Verifica lista vazia
                <tr>{/* Cria linha única para mensagem */}
                  <td colSpan={4} className="vazio">Nenhum usuário encontrado.</td>{/* Mensagem de vazio */}
                </tr> // Fecha linha
              )}{/* Encerra condição */}
            </tbody>{/* Fecha corpo */}
          </table>{/* Fecha tabela */}
        </div> // Fecha contêiner
      )}{/* Encerra renderização condicional */}
    </div> // Fecha wrapper
  )
}

// Exporta o componente para uso na Home
export default ConsultarUsuario
