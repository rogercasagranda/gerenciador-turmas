import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import '../../styles/CadastrarUsuario.css'

type MeuPerfil = { id_usuario?: number; tipo_perfil?: string; is_master?: boolean }

// Perfis autorizados a acessar a página de usuários
const PERFIS_PERMITIDOS = new Set([
  'master',
  'diretor',
  'secretaria',
])

// Canonical perfis para o select reduzido
const PERFIS_SELECT = [
  { value: 'master', label: 'Master' },
  { value: 'diretor', label: 'Diretor(a)' },
  { value: 'coordenador', label: 'Coordenador(a)' },
  { value: 'secretaria', label: 'Secretaria' },
  { value: 'professor', label: 'Professor(a)' },
  { value: 'aluno', label: 'Aluno(a)' },
  { value: 'responsavel', label: 'Responsável' },
]

// Normaliza qualquer variante para nosso canônico (diretora -> diretor, coordenadora -> coordenador, professora -> professor)
function toCanonical(perfil: string): string {
  const p = (perfil || '').toLowerCase()
  if (p.startsWith('diretor')) return 'diretor'
  if (p.startsWith('coordenador')) return 'coordenador'
  if (p.startsWith('professor')) return 'professor'
  if (p === 'aluno' || p === 'aluna') return 'aluno'
  return p
}

// Fallback: decodifica o payload do JWT se /usuarios/me falhar (422 etc.)
function getClaimsFromToken(): { sub?: string; role?: string; perfil?: string; tipo_perfil?: string } | null {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try { return JSON.parse(atob(parts[1])) } catch { return null }
}

const CadastrarUsuario: React.FC = () => {
  const [search] = useSearchParams()
  const idEdicao = useMemo(() => {
    const raw = search.get('id')
    return raw ? Number(raw) : undefined
  }, [search])

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')

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

  // >>> NOVO: dados do usuário logado (robusto)
  const [meuId, setMeuId] = useState<number | undefined>(undefined)
  const [meuPerfil, setMeuPerfil] = useState<string>('')
  const [souMaster, setSouMaster] = useState<boolean>(false)

  // Guard + perfil com fallback + LOG no backend
  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
        if (!token) { navigate('/login'); return }
        // tenta /me
        const r = await fetch(`${API_BASE}/usuarios/me`, { headers })
        if (r.ok) {
          const m = (await r.json()) as MeuPerfil
          const p = toCanonical(m.tipo_perfil || '')
          const isMaster = Boolean(m.is_master || p === 'master')
          const autorizado = isMaster || PERFIS_PERMITIDOS.has(p)
          if (!autorizado) { navigate('/home'); return }
          setMeuId(m.id_usuario)
          setMeuPerfil(p)
          setSouMaster(isMaster)
        } else {
          // fallback: token payload
          const claims = getClaimsFromToken()
          const p = toCanonical((claims?.role || claims?.perfil || claims?.tipo_perfil || '').toString())
          const id = claims?.sub ? Number(claims.sub) : undefined
          const isMaster = p === 'master'
          const autorizado = isMaster || PERFIS_PERMITIDOS.has(p)
          if (!autorizado) { navigate('/home'); return }
          setMeuId(id)
          setMeuPerfil(p)
          setSouMaster(isMaster)
        }
        // Sempre registra no log do backend o perfil/id que acessou
        try { await fetch(`${API_BASE}/usuarios/log-perfil`, { headers }) } catch {}
      } catch {}
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
        setPerfil(toCanonical(u.tipo_perfil))
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

      if (idEdicao) {
        await axios.put(`${API_BASE}/usuarios/${idEdicao}`, body, { headers: jsonHeaders })
        setSucesso('Usuário atualizado com sucesso.')
      } else {
        await axios.post(`${API_BASE}/usuarios`, body, { headers: jsonHeaders })
        setSucesso('Usuário cadastrado com sucesso.')
        setNome(''); setEmail(''); setPerfil('professor'); setDdi('55'); setDdd('54'); setNumeroCelular('')
      }

      setTimeout(() => navigate('/usuarios/consultar'), 700)
    } catch (err: any) {
      setErro(err?.response?.data?.detail || (idEdicao ? 'Falha ao atualizar usuário.' : 'Erro ao cadastrar usuário.'))
    } finally {
      setEnviando(false)
    }
  }

  // Lógica do botão Excluir: apenas master/diretor e sem autoexclusão
  const podeExcluir = Boolean(
    idEdicao &&
    (souMaster || meuPerfil === 'diretor') &&
    meuId !== idEdicao &&
    !(perfil === 'master' && !souMaster)
  )

  const handleExcluir = async () => {
    if (!idEdicao) return
    const primeira = window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')
    if (!primeira) return
    const segunda = window.confirm('Confirme novamente: deseja realmente excluir?')
    if (!segunda) return
    try {
      await axios.delete(`${API_BASE}/usuarios/${idEdicao}`, { headers })
      alert('Usuário excluído com sucesso.')
      navigate('/usuarios/consultar')
    } catch (e:any) {
      setErro(e?.response?.data?.detail || 'Falha ao excluir usuário.')
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

          <div className="campo">
            <label className="rotulo" htmlFor="perfil">Perfil</label>
            <select id="perfil" className="entrada" value={perfil} onChange={(e) => setPerfil(toCanonical(e.target.value))}>
              {PERFIS_SELECT.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
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

            {/* NOVO: Botão Excluir usuário (robusto ao erro do /me) */}
            {podeExcluir && (
              <button type="button" className="btn perigo" onClick={handleExcluir} aria-label="Excluir usuário" title="Excluir usuário">
                Excluir usuário
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

export default CadastrarUsuario
