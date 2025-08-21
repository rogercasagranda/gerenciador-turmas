// Página de cadastro de ano letivo utilizando apenas
// os campos { descricao, data_inicio, data_fim }

import React, { useEffect, useState } from 'react' // Importa React e hooks
import { useNavigate } from 'react-router-dom'
import FormPage from '../../components/FormPage' // Layout padrão
import '../../styles/CadastrarUsuario.css' // Reaproveita estilos existentes
import '../../styles/Forms.css'
import useDirtyForm from '@/hooks/useDirtyForm'
import {
  AnoLetivo,
  getAnoLetivos,
  createAnoLetivo,
  updateAnoLetivo,
  deleteAnoLetivo,
} from '../../services/anoLetivo'
import { API_BASE, getAuthToken } from '@/services/api'

// Perfis autorizados a gerenciar a página
const PERFIS_PERMITIDOS = new Set(['master', 'diretor', 'secretaria'])

// Normaliza variações de perfil
const toCanonical = (perfil: string) => {
  const p = (perfil || '').toLowerCase()
  if (p.startsWith('diretor')) return 'diretor'
  if (p.startsWith('coordenador')) return 'coordenador'
  if (p.startsWith('professor')) return 'professor'
  if (p === 'aluno' || p === 'aluna') return 'aluno'
  return p
}

// Fallback: decodifica payload do JWT quando /usuarios/me falhar
function getClaimsFromToken(): { sub?: string; role?: string; perfil?: string; tipo_perfil?: string } | null {
  const token = getAuthToken()
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(atob(parts[1]))
  } catch {
    return null
  }
}

// Componente principal
const AnoLetivoPage: React.FC = () => {
  const [lista, setLista] = useState<AnoLetivo[]>([]) // Anos cadastrados
  const [editando, setEditando] = useState<AnoLetivo | null>(null) // Ano em edição
  const [descricao, setDescricao] = useState('') // Campo descrição
  const [inicio, setInicio] = useState('') // Campo data início
  const [fim, setFim] = useState('') // Campo data fim
  const [erro, setErro] = useState('') // Mensagem de erro
  const [meuPerfil, setMeuPerfil] = useState('')
  const [souMaster, setSouMaster] = useState(false)

  const navigate = useNavigate()

  const { isDirty, setDirty, confirmIfDirty } = useDirtyForm()
  const podeAcoes = souMaster || PERFIS_PERMITIDOS.has(meuPerfil)

  // Verifica sessão e perfil ao montar
  useEffect(() => {
    const check = async () => {
      try {
        const token = getAuthToken()
        if (!token) { navigate('/login'); return }
        const headers = { Authorization: `Bearer ${token}` }
        try {
          const r = await fetch(`${API_BASE}/usuarios/me`, { headers })
          if (r.ok) {
            const m = await r.json()
            const p = toCanonical(m.tipo_perfil || '')
            const isMaster = Boolean(m.is_master || p === 'master')
            const autorizado = isMaster || PERFIS_PERMITIDOS.has(p)
            if (!autorizado) { navigate('/home'); return }
            setMeuPerfil(p)
            setSouMaster(isMaster)
          } else {
            const claims = getClaimsFromToken()
            const p = toCanonical((claims?.role || claims?.perfil || claims?.tipo_perfil || '') as string)
            const isMaster = p === 'master'
            const autorizado = isMaster || PERFIS_PERMITIDOS.has(p)
            if (!autorizado) { navigate('/home'); return }
            setMeuPerfil(p)
            setSouMaster(isMaster)
          }
          try { await fetch(`${API_BASE}/usuarios/log-perfil`, { headers }) } catch {}
        } catch {
          navigate('/login')
        }
      } catch {
        navigate('/login')
      }
    }
    check()
  }, [navigate])

  // Carrega anos ao montar
  useEffect(() => {
    getAnoLetivos().then(setLista).catch(() => setLista([]))
  }, [])

  // Limpa formulário para novo cadastro
  const limpar = () => {
    if (!podeAcoes) return
    setEditando(null)
    setDescricao('')
    setInicio('')
    setFim('')
    setErro('')
    setDirty(false)
  }

  // Preenche formulário para edição
  const editar = (a: AnoLetivo) => {
    if (!podeAcoes) return
    setEditando(a)
    setDescricao(a.descricao)
    setInicio(a.data_inicio.slice(0, 10))
    setFim(a.data_fim.slice(0, 10))
    setErro('')
    setDirty(false)
  }

  // Exclui um registro
  const excluir = async (id: number) => {
    if (!podeAcoes) return
    try {
      await deleteAnoLetivo(id)
      setLista(prev => prev.filter(a => a.id !== id))
      if (editando?.id === id) limpar()
    } catch {}
  }

  // Verifica se formulário está válido
  const podeSalvar =
    descricao.trim().length >= 3 &&
    inicio !== '' &&
    fim !== '' &&
    inicio <= fim

  // Envia dados ao backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!podeAcoes) { setErro('Sem permissão.'); return }
    if (!podeSalvar) {
      if (!descricao || !inicio || !fim) setErro('Preencha todos os campos.')
      else if (inicio > fim) setErro('Data inicial deve ser anterior ou igual à final.')
      return
    }
    const dto = { descricao: descricao.trim(), data_inicio: inicio, data_fim: fim }
    try {
      if (editando) {
        const upd = await updateAnoLetivo(editando.id, dto)
        setLista(prev => prev.map(a => (a.id === upd.id ? upd : a)))
      } else {
        const novo = await createAnoLetivo(dto)
        setLista(prev => [...prev, novo])
      }
      setDirty(false)
      limpar()
    } catch (err: any) {
      const msg = String(err.message)
      if (msg.includes('409')) setErro('Descrição duplicada.')
      else if (msg.includes('422')) setErro('Datas inválidas.')
      else if (msg.includes('403')) setErro('Sem permissão.')
      else setErro('Falha ao salvar.')
    }
  }

  return (
    <FormPage title="Cadastro de Ano Letivo">
      {/* Botão para iniciar novo cadastro */}
      <div className="acoes">
        {podeAcoes && (
          <button className="btn primario button" onClick={limpar}>Novo</button>
        )}
      </div>

      {/* Tabela de anos cadastrados */}
      <table className="holiday-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(a => (
            <tr key={a.id}>
              <td>{a.descricao}</td>
              <td>{new Date(a.data_inicio).toLocaleDateString('pt-BR')}</td>
              <td>{new Date(a.data_fim).toLocaleDateString('pt-BR')}</td>
              <td>
                {podeAcoes ? (
                  <>
                    <button className="btn" onClick={() => editar(a)}>Editar</button>
                    <button className="btn" onClick={() => excluir(a.id)}>Excluir</button>
                  </>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formulário de criação/edição */}
      <form onSubmit={handleSubmit} className="cadastro-form">
        <div className="linha tres">
          <div className="campo">
            <label className="rotulo" htmlFor="descricao">Ano Letivo</label>
            <input
              id="descricao"
              className="entrada"
              type="text"
              value={descricao}
              disabled={!podeAcoes}
              onChange={e => { setDescricao(e.target.value); setDirty(true) }}
            />
          </div>
          <div className="campo">
            <label className="rotulo" htmlFor="inicio">Início</label>
            <input
              id="inicio"
              className="entrada"
              type="date"
              value={inicio}
              disabled={!podeAcoes}
              onChange={e => { setInicio(e.target.value); setDirty(true) }}
            />
          </div>
          <div className="campo">
            <label className="rotulo" htmlFor="fim">Fim</label>
            <input
              id="fim"
              className="entrada"
              type="date"
              value={fim}
              disabled={!podeAcoes}
              onChange={e => { setFim(e.target.value); setDirty(true) }}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            type="submit"
            className="button save-button"
            disabled={!podeAcoes || !isDirty || !podeSalvar}
          >
            Salvar
          </button>
        </div>
      </form>

      {/* Mensagem de erro */}
      {erro && <div className="alerta erro">{erro}</div>}
    </FormPage>
  )
}

export default AnoLetivoPage

