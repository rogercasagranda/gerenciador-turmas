// Página de cadastro de feriados
import React, { useEffect, useMemo, useState } from 'react'
import FormPage from '../../components/FormPage'
import '../../styles/CadastrarUsuario.css'
import '../../styles/Feriados.css'
import { AnoLetivo, Periodo, getAnoLetivos, getPeriodos } from '../../services/anoLetivo'
import {
  Feriado,
  getFeriados,
  createFeriado,
  updateFeriado,
  deleteFeriado,
  importarNacionais,
} from '../../services/feriados'

// Função utilitária para formatar datas como dd/mm/aaaa
function formatar(data: string): string {
  return new Date(data).toLocaleDateString('pt-BR')
}

// Verifica se uma data cai em algum período
function dentroDeAlgumPeriodo(data: string, periodos: Periodo[]): boolean {
  const d = new Date(data)
  return periodos.some(p => d >= new Date(p.data_inicio) && d <= new Date(p.data_fim))
}

// Remove duplicados pelo trio data/descricao/origem
function dedup(lista: Feriado[]): Feriado[] {
  const mapa = new Map<string, Feriado>()
  lista.forEach(f => {
    const chave = `${f.data}-${f.descricao}-${f.origem}`
    if (!mapa.has(chave)) mapa.set(chave, f)
  })
  return Array.from(mapa.values())
}

const Feriados: React.FC = () => {
  // Anos letivos disponíveis
  const [anos, setAnos] = useState<AnoLetivo[]>([])
  // Ano letivo selecionado
  const [anoSelecionado, setAnoSelecionado] = useState<number | ''>('')
  // Períodos do ano selecionado
  const [periodos, setPeriodos] = useState<Periodo[]>([])
  // Lista de feriados
  const [feriados, setFeriados] = useState<Feriado[]>([])
  // Controle do formulário (novo/editar)
  const [formAberto, setFormAberto] = useState(false)
  const [editando, setEditando] = useState<Feriado | null>(null)
  const [data, setData] = useState('')
  const [descricao, setDescricao] = useState('')
  // Modal de importação
  const [modalImportar, setModalImportar] = useState(false)
  const [anosImport, setAnosImport] = useState<number[]>([])
  // Feedback ao usuário
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  // Carrega anos letivos ao montar
  useEffect(() => {
    getAnoLetivos().then(setAnos).catch(() => setAnos([]))
  }, [])

  // Carrega feriados e períodos ao selecionar ano
  useEffect(() => {
    const carregar = async () => {
      if (!anoSelecionado) { setPeriodos([]); setFeriados([]); return }
      try {
        const [p, f] = await Promise.all([
          getPeriodos(Number(anoSelecionado)),
          getFeriados(Number(anoSelecionado)),
        ])
        setPeriodos(p)
        // Ordena por data crescente
        setFeriados(dedup(f).sort((a, b) => a.data.localeCompare(b.data)))
      } catch {
        setPeriodos([]); setFeriados([])
      }
    }
    carregar()
  }, [anoSelecionado])

  // Label com períodos para exibir ao usuário
  const labelPeriodos = useMemo(() => (
    periodos.map(p => `${formatar(p.data_inicio)} - ${formatar(p.data_fim)}`).join('; ')
  ), [periodos])

  // Anos civis cobertos pelos períodos (para importar nacionais)
  const anosCobertos = useMemo(() => {
    const set = new Set<number>()
    periodos.forEach(p => {
      set.add(new Date(p.data_inicio).getFullYear())
      set.add(new Date(p.data_fim).getFullYear())
    })
    return Array.from(set.values()).sort()
  }, [periodos])

  // Abre formulário para novo feriado
  const abrirNovo = () => {
    setEditando(null); setData(''); setDescricao(''); setFormAberto(true)
  }

  // Abre formulário para edição
  const abrirEdicao = (f: Feriado) => {
    setEditando(f); setData(f.data); setDescricao(f.descricao); setFormAberto(true)
  }

  // Fecha formulário
  const fecharForm = () => {
    setFormAberto(false); setEditando(null); setData(''); setDescricao('')
  }

  // Salva novo/alterado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!anoSelecionado) { setErro('Selecione um ano letivo.'); return }
    setErro(''); setSucesso('')
    try {
      if (editando) {
        await updateFeriado(editando.id!, { data, descricao })
        setSucesso('Feriado atualizado.')
      } else {
        await createFeriado({ ano_letivo_id: Number(anoSelecionado), data, descricao, origem: 'ESCOLA' })
        setSucesso('Feriado cadastrado.')
      }
      const lista = await getFeriados(Number(anoSelecionado))
      setFeriados(dedup(lista).sort((a, b) => a.data.localeCompare(b.data)))
      fecharForm()
    } catch (e: any) {
      const msg = String(e.message)
      if (msg.includes('409')) setErro('Feriado já cadastrado.')
      else if (msg.includes('422')) setErro('Dados inválidos.')
      else setErro('Falha ao salvar feriado.')
    }
  }

  // Exclui feriado
  const handleExcluir = async (id?: number) => {
    if (!id) return
    setErro(''); setSucesso('')
    try {
      await deleteFeriado(id)
      setFeriados(prev => prev.filter(f => f.id !== id))
    } catch {
      setErro('Falha ao excluir feriado.')
    }
  }

  // Abre modal de importação
  const abrirImportar = () => {
    setAnosImport(anosCobertos)
    setModalImportar(true)
  }

  // Importa feriados nacionais
  const confirmarImportar = async () => {
    if (!anoSelecionado) return
    setErro(''); setSucesso('')
    try {
      await importarNacionais({ ano_letivo_id: Number(anoSelecionado), anos: anosImport })
      const lista = await getFeriados(Number(anoSelecionado))
      setFeriados(dedup(lista).sort((a, b) => a.data.localeCompare(b.data)))
      setSucesso('Feriados importados com sucesso.')
    } catch (e: any) {
      const msg = String(e.message)
      if (msg.includes('409')) setErro('Feriados já importados.')
      else if (msg.includes('422')) setErro('Dados inválidos.')
      else setErro('Falha ao importar feriados.')
    } finally {
      setModalImportar(false)
    }
  }

  // Alterna seleção de um ano na modal
  const toggleAno = (ano: number) => {
    setAnosImport(prev => prev.includes(ano) ? prev.filter(a => a !== ano) : [...prev, ano])
  }

  return (
    <FormPage title="Cadastro de Feriados">
      {/* Seletor de ano letivo */}
      <div className="linha">
        <div className="campo">
          <label className="rotulo" htmlFor="anoLetivo">Ano letivo</label>
          <select id="anoLetivo" className="entrada" value={anoSelecionado} onChange={e => setAnoSelecionado(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Selecione</option>
            {anos.map(a => (
              <option key={a.id} value={a.id}>{a.ano}</option>
            ))}
          </select>
          {labelPeriodos && <span className="rotulo">Períodos: {labelPeriodos}</span>}
        </div>
      </div>

      {/* Ações principais */}
      <div className="acoes">
        <button className="btn primario" onClick={abrirNovo} disabled={!anoSelecionado}>Novo Feriado</button>
        <button className="btn secundario" onClick={abrirImportar} disabled={!anoSelecionado}>Importar Nacionais</button>
      </div>

      {/* Mensagens de feedback */}
      {erro && <div className="alerta erro">{erro}</div>}
      {sucesso && <div className="alerta sucesso">{sucesso}</div>}

      {/* Formulário para novo/editar */}
      {formAberto && (
        <form className="cadastro-form" onSubmit={handleSubmit}>
          <div className="linha dois">
            <div className="campo">
              <label className="rotulo" htmlFor="dataFeriado">Data</label>
              <input id="dataFeriado" type="date" className="entrada" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div className="campo">
              <label className="rotulo" htmlFor="descFeriado">Descrição</label>
              <input id="descFeriado" type="text" className="entrada" value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
          </div>
          <div className="acoes">
            <button type="button" className="btn secundario" onClick={fecharForm}>Cancelar</button>
            <button type="submit" className="btn primario" disabled={!data || !descricao.trim() || !dentroDeAlgumPeriodo(data, periodos)}>
              {editando ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de feriados */}
      <table className="holiday-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Origem</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {feriados.map(f => (
            <tr key={f.id || `${f.data}-${f.descricao}-${f.origem}`}>
              <td>{formatar(f.data)}</td>
              <td>{f.descricao}</td>
              <td>{f.origem}</td>
              <td>
                {f.origem === 'ESCOLA' && (
                  <>
                    <button className="btn secundario" onClick={() => abrirEdicao(f)}>Editar</button>
                    <button className="btn perigo" onClick={() => handleExcluir(f.id)}>Excluir</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal para importar nacionais */}
      {modalImportar && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true">
            <h3>Importar feriados nacionais</h3>
            <div className="linha">
              {anosCobertos.map(a => (
                <label key={a} className="campo">
                  <span>
                    <input type="checkbox" checked={anosImport.includes(a)} onChange={() => toggleAno(a)} /> {a}
                  </span>
                </label>
              ))}
            </div>
            <div className="modal-acoes">
              <button className="btn secundario" type="button" onClick={() => setModalImportar(false)}>Cancelar</button>
              <button className="btn primario" type="button" onClick={confirmarImportar} disabled={anosImport.length === 0}>Importar</button>
            </div>
          </div>
        </div>
      )}
    </FormPage>
  )
}

export default Feriados
