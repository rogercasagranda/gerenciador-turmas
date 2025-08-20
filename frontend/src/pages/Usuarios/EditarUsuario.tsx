// Importa React e hooks
import React, { useEffect, useState } from 'react'                        // Importa React/useState/useEffect
import axios from 'axios'                                                 // Importa axios
import { useNavigate, useParams } from 'react-router-dom'                 // Importa navegação/params
import { API_BASE } from '@/services/api'
import '../../styles/CadastrarUsuario.css'                                 // Reaproveita CSS do cadastro

// Define tipo do usuário
type Usuario = {                                                          // Tipo do usuário
  id: number                                                              // Id
  nome: string                                                            // Nome
  email: string                                                           // E-mail
  tipo_perfil: string                                                     // Perfil
  ddi: string                                                             // DDI
  ddd: string                                                             // DDD
  numero_celular: string                                                  // Número
}

// Converte variações (ex: diretora) para a forma canônica
const toCanonical = (perfil: string) => {
  const p = (perfil || '').toLowerCase()
  if (p.startsWith('diretor')) return 'diretor'
  if (p.startsWith('coordenador')) return 'coordenador'
  if (p.startsWith('professor')) return 'professor'
  if (p === 'aluno' || p === 'aluna') return 'aluno'
  return p
}

const EditarUsuario: React.FC = () => {                                   // Define componente
  const [usuario, setUsuario] = useState<Usuario | null>(null)            // Estado do usuário
  const [erro, setErro] = useState<string>('')                            // Estado erro
  const [sucesso, setSucesso] = useState<string>('')                      // Estado sucesso
  const [enviando, setEnviando] = useState<boolean>(false)                // Estado envio

  const { id } = useParams()                                              // Lê id da rota
  const navigate = useNavigate()                                          // Navegação

  useEffect(() => {                                                        // Efeito de carregamento
    setErro('')                                                            // Limpa erro
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') // Lê token
    const headers: Record<string, string> = {}                             // Prepara headers
    if (token) headers['Authorization'] = `Bearer ${token}`               // Injeta Bearer

    axios.get(`${API_BASE}/usuarios/${id}`, { headers })                  // GET /usuarios/{id}
      .then((res) => {
        const u = res.data
        u.tipo_perfil = toCanonical(u.tipo_perfil)
        setUsuario(u)
      })                                // Guarda usuário
      .catch((e) => {                                                     // Trata erro
        const msg = e?.response?.data?.detail || 'Falha ao carregar usuário.' // Extrai mensagem
        setErro(msg)                                                      // Define erro
      })                                                                  // Finaliza then/catch
  }, [API_BASE, id])                                                      // Dependências

  const handleSubmit = async (e: React.FormEvent) => {                    // Define envio
    e.preventDefault()                                                    // Previne reload
    if (!usuario) return                                                  // Se sem usuário retorna
    setErro('')                                                           // Limpa erro
    setSucesso('')                                                        // Limpa sucesso

    if (!usuario.nome.trim()) { setErro('O nome é obrigatório.'); return }         // Valida nome
    if (!usuario.email.trim()) { setErro('O e-mail é obrigatório.'); return }      // Valida e-mail
    if (!usuario.numero_celular.trim()) { setErro('O número de celular é obrigatório.'); return } // Valida número

    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') // Lê token
    const headers: Record<string, string> = { 'Content-Type': 'application/json' } // Define headers
    if (token) headers['Authorization'] = `Bearer ${token}`               // Injeta Bearer

    try {                                                                 // Tenta enviar
      setEnviando(true)                                                   // Marca envio
      await axios.put(`${API_BASE}/usuarios/${usuario.id}`, {             // PUT /usuarios/{id}
        nome: usuario.nome,                                               // Nome
        email: usuario.email,                                             // E-mail
        tipo_perfil: usuario.tipo_perfil,                                 // Perfil
        ddi: usuario.ddi,                                                 // DDI
        ddd: usuario.ddd,                                                 // DDD
        numero_celular: usuario.numero_celular,                           // Número
      }, { headers })                                                     // Headers

      setSucesso('Usuário atualizado com sucesso.')                       // Mensagem de sucesso
      setTimeout(() => navigate('/usuarios/consultar'), 800)             // Redireciona
    } catch (err: any) {                                                  // Em erro
      const msg = err?.response?.data?.detail || 'Falha ao atualizar usuário.' // Extrai mensagem
      setErro(msg)                                                        // Define erro
    } finally {                                                           // Sempre executa
      setEnviando(false)                                                  // Desmarca envio
    }                                                                     // Finaliza try/catch
  }                                                                       // Finaliza handleSubmit

  return (                                                                // Renderização
    <div className="cadastro-wrapper">                                    {/* Container */}
      <h2 className="cadastro-titulo">Alterar Usuário</h2>                {/* Título */}

      {erro && <div className="alerta erro">{erro}</div>}                 {/* Exibe erro */}
      {sucesso && <div className="alerta sucesso">{sucesso}</div>}        {/* Exibe sucesso */}

      {!usuario ? (                                                       // Se ainda carregando
        <div>Carregando…</div>                                            // Placeholder
      ) : (                                                               // Quando tem usuário
        <form className="cadastro-form" onSubmit={handleSubmit}>          {/* Formulário */}
          <div className="campo">                                         {/* Campo nome */}
            <label htmlFor="nome" className="rotulo">Nome completo</label>{/* Rótulo */}
            <input id="nome" type="text" className="entrada"             // Input
              value={usuario.nome} onChange={(e) => setUsuario({ ...usuario, nome: e.target.value })} // Atualiza
              required />                                                {/* Obrigatório */}
          </div>

          <div className="campo">                                         {/* Campo e-mail */}
            <label htmlFor="email" className="rotulo">E-mail</label>      {/* Rótulo */}
            <input id="email" type="email" className="entrada"           // Input
              value={usuario.email} onChange={(e) => setUsuario({ ...usuario, email: e.target.value })} // Atualiza
              required />                                                {/* Obrigatório */}
          </div>

          <div className="linha-tripla">                                  {/* Linha DDI/DDD/Número */}
            <div className="campo">                                       {/* Campo perfil */}
              <label htmlFor="perfil" className="rotulo">Perfil</label>   {/* Rótulo */}
              <select id="perfil" className="entrada"                    // Select
                value={usuario.tipo_perfil} onChange={(e) => setUsuario({ ...usuario, tipo_perfil: e.target.value })} // Atualiza
              >
                <option value="master">Master</option>
                <option value="diretor">Diretor(a)</option>
                <option value="coordenador">Coordenador(a)</option>
                <option value="secretaria">Secretaria</option>
                <option value="professor">Professor(a)</option>
                <option value="aluno">Aluno(a)</option>
                <option value="responsavel">Responsável</option>
              </select>
            </div>

            <div className="campo">                                       {/* Campo DDI */}
              <label htmlFor="ddi" className="rotulo">DDI</label>         {/* Rótulo */}
              <input id="ddi" type="text" className="entrada"            // Input
                value={usuario.ddi} onChange={(e) => setUsuario({ ...usuario, ddi: e.target.value })} // Atualiza
              />
            </div>

            <div className="campo">                                       {/* Campo DDD */}
              <label htmlFor="ddd" className="rotulo">DDD</label>         {/* Rótulo */}
              <input id="ddd" type="text" className="entrada"            // Input
                value={usuario.ddd} onChange={(e) => setUsuario({ ...usuario, ddd: e.target.value })} // Atualiza
              />
            </div>
          </div>

          <div className="campo">                                         {/* Campo número */}
            <label htmlFor="numero" className="rotulo">Número de celular</label>{/* Rótulo */}
            <input id="numero" type="tel" className="entrada"            // Input
              value={usuario.numero_celular} onChange={(e) => setUsuario({ ...usuario, numero_celular: e.target.value })} // Atualiza
              required />                                                {/* Obrigatório */}
          </div>

          <div className="acoes">                                         {/* Área de ações */}
            <button type="submit" className="botao" disabled={enviando}> {/* Botão salvar */}
              {enviando ? 'Salvando…' : 'Salvar alterações'}             {/* Texto */}
            </button>
            <button type="button" className="botao secundario" onClick={() => navigate('/usuarios/consultar')}> {/* Cancelar */}
              Cancelar                                                   {/* Texto */}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default EditarUsuario                                               // Exporta componente
