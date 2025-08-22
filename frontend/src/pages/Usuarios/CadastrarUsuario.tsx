import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useBaseNavigate from '@/hooks/useBaseNavigate'
import '../../styles/CadastrarUsuario.css'
import '../../styles/Forms.css'
import useDirtyForm from '@/hooks/useDirtyForm'

import { API_BASE, apiFetch, getAuthToken } from '@/services/api'
import { safeAlert } from '@/utils/safeAlert'


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
  const token = getAuthToken()
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

  const navigate = useBaseNavigate()


  // Obtém headers com JWT ou redireciona para login
  const authHeaders = () => {
    const t = getAuthToken()
    if (!t) {
      navigate('/login')
      return null
    }
    return { Authorization: `Bearer ${t}` }
  }


  const { isDirty, setDirty, confirmIfDirty } = useDirtyForm()

  // >>> NOVO: dados do usuário logado (robusto)
  const [meuId, setMeuId] = useState<number | undefined>(undefined)
  const [meuPerfil, setMeuPerfil] = useState<string>('')
  const [souMaster, setSouMaster] = useState<boolean>(false)

  // Guard + perfil com fallback + LOG no backend
  useEffect(() => {
    const check = async () => {
      try {

        const headers = authHeaders()
        if (!headers) return
        const m = await apiFetch('/usuarios/me') as MeuPerfil

        const p = toCanonical(m.tipo_perfil || '')
        const isMaster = Boolean(m.is_master || p === 'master')
        const autorizado = isMaster || PERFIS_PERMITIDOS.has(p)
        if (!autorizado) { safeAlert('ACESSO NEGADO'); return }
        setMeuId(m.id_usuario)
        setMeuPerfil(p)
        setSouMaster(isMaster)

        try { await apiFetch('/usuarios/log-perfil') } catch {}
      } catch (e: any) {
        if (e?.status === 401) {
          navigate('/login')
          return
        }

        const claims = getClaimsFromToken()
        const p = toCanonical((claims?.role || claims?.perfil || claims?.tipo_perfil || '').toString())
        const id = claims?.sub ? Number(claims.sub) : undefined
        const isMaster = p === 'master'
        const autorizado = isMaster || PERFIS_PERMITIDOS.has(p)
        if (!autorizado) { safeAlert('ACESSO NEGADO'); return }
        setMeuId(id)
        setMeuPerfil(p)
        setSouMaster(isMaster)
      }
    }
    check()
  }, [navigate])


  // Se entrou com ?id, carrega dados para editar
  useEffect(() => {
    if (!idEdicao) return
    const headers = authHeaders()
    if (!headers) return
    setCarregandoEdicao(true); setErro(''); setSucesso('')

    axios
      .get(`${API_BASE}/usuarios/${idEdicao}`, { headers })
      .then((res) => {
        const u = res.data

        setNome(u.nome)
        setEmail(u.email)
        setPerfil(toCanonical(u.tipo_perfil))
        setDdi(u.ddi)
        setDdd(u.ddd)
        setNumeroCelular(u.numero_celular)
        setDirty(false)
      })

      .catch((e) => {
        if (e?.response?.status === 401) navigate('/login')
        else if (e?.response?.status === 403) safeAlert('ACESSO NEGADO')
        else setErro(e?.response?.data?.detail || 'Falha ao carregar usuário.')
      })
      .finally(() => setCarregandoEdicao(false))
  }, [API_BASE, idEdicao, navigate])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setSucesso('')
    if (!nome.trim()) { setErro('O nome é obrigatório.'); return }
    if (!email.trim()) { setErro('O e-mail é obrigatório.'); return }
    if (!numeroCelular.trim()) { setErro('O número de celular é obrigatório.'); return }

    const headers = authHeaders()
    if (!headers) return
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

      setDirty(false)
      setTimeout(() => navigate('/usuarios/consultar'), 700)
    } catch (err: any) {

      if (err?.response?.status === 401) navigate('/login')
      else if (err?.response?.status === 403) safeAlert('ACESSO NEGADO')
      else
        setErro(
          err?.response?.data?.detail || (idEdicao ? 'Falha ao atualizar usuário.' : 'Erro ao cadastrar usuário.'),
        )

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
    const headers = authHeaders()
    if (!headers) return
    try {

      await apiFetch(`/usuarios/${idEdicao}`, { method: 'DELETE' })
      alert('Usuário excluído com sucesso.')
      navigate('/usuarios/consultar')

    } catch (e: any) {
      if (e?.status === 401) navigate('/login')
      else if (e?.status === 403) safeAlert('ACESSO NEGADO')
      else setErro(e?.payload?.detail || 'Falha ao excluir usuário.')

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
              <input
                id="nome"
                className="entrada"
                type="text"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setDirty(true) }}
                required
              />
            </div>

            <div className="campo">
              <label className="rotulo" htmlFor="email">E-mail</label>
              <input
                id="email"
                className="entrada"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setDirty(true) }}
                required
              />
            </div>

            <div className="campo">
              <label className="rotulo" htmlFor="perfil">Perfil</label>
              <select
                id="perfil"
                className="entrada"
                value={perfil}
                onChange={(e) => { setPerfil(toCanonical(e.target.value)); setDirty(true) }}
              >
                {PERFIS_SELECT.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

          {/* DDI + DDD + Número na mesma linha */}
          <div className="linha tres-telefone">
              <div className="campo curto">
                <label className="rotulo" htmlFor="ddi">DDI</label>
                <input
                  id="ddi"
                  className="entrada"
                  type="text"
                  value={ddi}
                  onChange={(e) => { setDdi(e.target.value); setDirty(true) }}
                />
              </div>
              <div className="campo curto">
                <label className="rotulo" htmlFor="ddd">DDD</label>
                <input
                  id="ddd"
                  className="entrada"
                  type="text"
                  value={ddd}
                  onChange={(e) => { setDdd(e.target.value); setDirty(true) }}
                />
              </div>
              <div className="campo">
                <label className="rotulo" htmlFor="numero">Número de celular</label>
                <input
                  id="numero"
                  className="entrada"
                  type="tel"
                  placeholder="Ex.: 991234567"
                  value={numeroCelular}
                  onChange={(e) => { setNumeroCelular(e.target.value); setDirty(true) }}
                  required
                />
              </div>
          </div>

            <div className="form-actions">
              <button
                type="button"
                className="button"
                onClick={() => {
                  if (!isDirty || confirmIfDirty()) navigate('/usuarios/consultar')
                }}
              >
                Consultar Usuários
              </button>
              <button type="submit" className="button save-button" disabled={enviando || !isDirty}>
                {enviando ? (idEdicao ? 'Salvando…' : 'Enviando…') : (idEdicao ? 'Salvar alterações' : 'Cadastrar')}
              </button>

              {/* NOVO: Botão Excluir usuário (robusto ao erro do /me) */}
              {podeExcluir && (
                <button
                  type="button"
                  className="button"
                  onClick={handleExcluir}
                  aria-label="Excluir usuário"
                  title="Excluir usuário"
                >
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
