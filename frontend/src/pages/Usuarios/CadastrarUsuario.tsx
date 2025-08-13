import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../../styles/CadastrarUsuario.css'

type MeuPerfil = { tipo_perfil?: string; is_master?: boolean }
const PERFIS_PERMITIDOS = new Set(['master','diretor','diretora','secretaria','coordenadora'])

const CadastrarUsuario: React.FC = () => {
  const [search] = useSearchParams()
  const idEdicao = useMemo(() => {
    const raw = search.get('id')
    return raw ? Number(raw) : undefined
  }, [search])

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')

  // Senha/Confirmar: visíveis, NÃO obrigatórios
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')

  const [perfil, setPerfil] = useState('professor')
  const [ddi, setDdi] = useState('55')
  const [ddd, setDdd] = useState('54')
  const [numeroCelular, setNumeroCelular] = useState('')

  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregandoEdicao, setCarregandoEdicao] = useState(false)

  const navigate = useNavigate()
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  const headers: Record<string, string> = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  // Guard: master/direção/secretaria
  useEffect(() => {
  const check = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      if (!token) { navigate('/login'); return }
      const r = await fetch(`${API_BASE}/usuarios/me`, { headers })
      if (r.status === 401) { navigate('/login'); return }
      if (!r.ok) { return } // tolera 422/5xx sem redirecionar
      const m = (await r.json()) as MeuPerfil
      const p = (m.tipo_perfil || '').toLowerCase()
      const autorizado = m.is_master || PERFIS_PERMITIDOS.has(p)
      if (!autorizado) { navigate('/home'); return }
    } catch {
      // tolera falhas de rede
    }
  }
  check()
}, [API_BASE, headers, navigate])

  // Se entrou com ?id, carrega dados para editar
  useEffect(() => {
    if (!idEdicao) return
    setCarregandoEdicao(true); setErro(''); setSucesso('')
    axios.get(`${API_BASE}/usuarios/${idEdicao}`, { headers })
      .then((res) => {
        const u = res.data
        setNome(u.nome)
        setEmail(u.email)
        setPerfil(u.tipo_perfil)
        setDdi(u.ddi)
        setDdd(u.ddd)
        setNumeroCelular(u.numero_celular)
      })
      .catch((e) => setErro(e?.response?.data?.detail || 'Falha ao carregar usuário.'))
      .finally(() => setCarregandoEdicao(false))
  }, [API_BASE, headers, idEdicao])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setSucesso('')
    if (!nome.trim()) { setErro('O nome é obrigatório.'); return }
    if (!email.trim()) { setErro('O e-mail é obrigatório.'); return }
    if (!numeroCelular.trim()) { setErro('O número de celular é obrigatório.'); return }

    const jsonHeaders: Record<string, string> = { ...headers, 'Content-Type': 'application/json' }

    try {
      setEnviando(true)
      const body: any = { nome, email, tipo_perfil: perfil, ddi, ddd, numero_celular: numeroCelular }
      if (senha.trim()) body.senha = senha.trim() // senha é opcional

      if (idEdicao) {
        await axios.put(`${API_BASE}/usuarios/${idEdicao}`, body, { headers: jsonHeaders })
        setSucesso('Usuário atualizado com sucesso.')
      } else {
        await axios.post(`${API_BASE}/usuarios`, body, { headers: jsonHeaders })
        setSucesso('Usuário cadastrado com sucesso.')
        setNome(''); setEmail(''); setPerfil('professor'); setDdi('55'); setDdd('54'); setNumeroCelular(''); setSenha(''); setConfirmarSenha('')
      }

      setTimeout(() => navigate('/usuarios/consultar'), 700)
    } catch (err: any) {
      setErro(err?.response?.data?.detail || (idEdicao ? 'Falha ao atualizar usuário.' : 'Erro ao cadastrar usuário.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="cadastro-wrapper">
      <h2 className="cadastro-titulo">{idEdicao ? 'Alterar Usuário' : 'Cadastrar Usuário'}</h2>

      {erro && <div className="alerta erro">{erro}</div>}
      {sucesso && <div className="alerta sucesso">{sucesso}</div>}
      {carregandoEdicao && <div>Carregando…</div>}

      {!carregandoEdicao && (
        <form className="cadastro-form" onSubmit={handleSubmit}>
          <div className="campo">
            <label className="rotulo" htmlFor="nome">Nome</label>
            <input id="nome" className="entrada" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="campo">
            <label className="rotulo" htmlFor="email">E-mail</label>
            <input id="email" className="entrada" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {/* campos de senha opcionais */}
          <div className="linha dois">
            <div className="campo">
              <label className="rotulo" htmlFor="senha">Senha</label>
              <input id="senha" className="entrada" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <div className="campo">
              <label className="rotulo" htmlFor="confirmar">Confirmar senha</label>
              <input id="confirmar" className="entrada" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
            </div>
          </div>

          <div className="campo">
            <label className="rotulo" htmlFor="perfil">Perfil</label>
            <select id="perfil" className="entrada" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
              <option value="master">Master</option>
              <option value="diretor">Diretor</option>
              <option value="diretora">Diretora</option>
              <option value="secretaria">Secretaria</option>
              <option value="coordenadora">Coordenadora</option>
              <option value="professor">Professor</option>
              <option value="professora">Professora</option>
              <option value="responsavel">Responsável</option>
              <option value="aluno">Aluno</option>
            </select>
          </div>

          {/* DDI + DDD + Número na mesma linha */}
          <div className="linha tres-telefone">
            <div className="campo curto">
              <label className="rotulo" htmlFor="ddi">DDI</label>
              <input id="ddi" className="entrada" type="text" value={ddi} onChange={(e) => setDdi(e.target.value)} />
            </div>
            <div className="campo curto">
              <label className="rotulo" htmlFor="ddd">DDD</label>
              <input id="ddd" className="entrada" type="text" value={ddd} onChange={(e) => setDdd(e.target.value)} />
            </div>
            <div className="campo">
              <label className="rotulo" htmlFor="numero">Número de celular</label>
              <input id="numero" className="entrada" type="tel" placeholder="Ex.: 991234567" value={numeroCelular} onChange={(e) => setNumeroCelular(e.target.value)} required />
            </div>
          </div>

          <div className="acoes">
            <button type="button" className="btn secundario" onClick={() => navigate('/usuarios/consultar')}>
              Consultar Usuários
            </button>
            <button type="submit" className="btn primario" disabled={enviando}>
              {enviando ? (idEdicao ? 'Salvando…' : 'Enviando…') : (idEdicao ? 'Salvar alterações' : 'Cadastrar')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default CadastrarUsuario
