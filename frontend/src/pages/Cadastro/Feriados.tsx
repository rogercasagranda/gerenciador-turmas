// Página de cadastro de feriados seguindo o padrão do cadastro de usuários
import React, { useEffect, useState } from 'react'
import FormPage from '../../components/FormPage'
import { AnoLetivo, getAnoLetivos } from '../../services/anoLetivo'
import {
  Feriado,
  getNacionais,
  getByAnoLetivo,
  create as createFeriado,
  remove as deleteFeriado,
  importarNacionais,
} from '../../services/feriados'
import '../../styles/CadastrarUsuario.css'

// Componente principal
const Feriados: React.FC = () => {
  // Anos letivos disponíveis
  const [anos, setAnos] = useState<AnoLetivo[]>([])
  // Ano selecionado
  const [anoSelecionado, setAnoSelecionado] = useState<AnoLetivo | undefined>(undefined)
  // Aba ativa
  const [aba, setAba] = useState<'nacionais' | 'escola'>('nacionais')
  // Dados das tabelas
  const [nacionais, setNacionais] = useState<Feriado[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  // Formulário manual
  const [data, setData] = useState('')
  const [descricao, setDescricao] = useState('')
  // Feedbacks
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Carrega anos ao montar
  useEffect(() => {
    getAnoLetivos().then(setAnos).catch(() => setAnos([]))
  }, [])

  // Ao selecionar ano carrega feriados
  const handleAnoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    const ano = anos.find(a => a.id === id)
    setAnoSelecionado(ano)
    setErro(''); setSucesso('')
    if (ano) {
      try {
        const [nac, esc] = await Promise.all([
          getNacionais(ano.ano),
          getByAnoLetivo(ano.id),
        ])
        setNacionais(nac)
        setFeriados(esc)
      } catch {
        setNacionais([]); setFeriados([])
      }
    } else {
      setNacionais([]); setFeriados([])
    }
  }

  // Importa feriados nacionais
  const handleImportar = async () => {
    if (!anoSelecionado) return
    setErro(''); setSucesso('')
    try {
      setCarregando(true)
      await importarNacionais({ ano_letivo_id: anoSelecionado.id, ano: anoSelecionado.ano })
      const atualizados = await getByAnoLetivo(anoSelecionado.id)
      setFeriados(atualizados)
      setSucesso('Feriados importados com sucesso.')
    } catch (e: any) {
      if (e.message?.includes('409')) setErro('Feriados já importados.')
      else setErro('Falha ao importar feriados.')
    } finally {
      setCarregando(false)
    }
  }

  // Envia novo feriado manual
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!anoSelecionado) { setErro('Selecione um ano letivo.'); return }
    if (!data) { setErro('A data é obrigatória.'); return }
    if (!descricao || descricao.trim().length < 3) { setErro('A descrição é obrigatória (mín. 3 caracteres).'); return }
    if (data < anoSelecionado.data_inicio || data > anoSelecionado.data_fim) { setErro('Data fora do ano letivo.'); return }
    setErro(''); setSucesso('')
    try {
      setCarregando(true)
      await createFeriado({ ano_letivo_id: anoSelecionado.id, data, descricao })
      const atualizados = await getByAnoLetivo(anoSelecionado.id)
      setFeriados(atualizados)
      setSucesso('Feriado cadastrado.')
      setData(''); setDescricao('')
    } catch (e: any) {
      if (e.message?.includes('409')) setErro('Feriado já cadastrado.')
      else if (e.message?.includes('422')) setErro('Dados inválidos.')
      else setErro('Falha ao cadastrar feriado.')
    } finally {
      setCarregando(false)
    }
  }

  // Exclui feriado existente
  const handleExcluir = async (id?: number) => {
    if (!id) return
    setErro(''); setSucesso('')
    try {
      await deleteFeriado(id)
      setFeriados(prev => prev.filter(f => f.id !== id))
      setSucesso('Feriado removido.')
    } catch {
      setErro('Falha ao excluir feriado.')
    }
  }

  return (
    <FormPage title="Cadastro de Feriados">
      {/* Seleção de ano letivo */}
      <div className="linha">
        <div className="campo">
          <label className="rotulo" htmlFor="anoLetivo">Ano letivo</label>
          <select id="anoLetivo" className="entrada" value={anoSelecionado?.id || ''} onChange={handleAnoChange}>
            <option value="">Selecione</option>
            {anos.map(a => (
              <option key={a.id} value={a.id}>{a.ano} ({a.data_inicio} - {a.data_fim})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Abas */}
      <div className="tabs">
        <button className={`tab ${aba === 'nacionais' ? 'ativo' : ''}`} onClick={() => setAba('nacionais')}>Feriados Nacionais</button>
        <button className={`tab ${aba === 'escola' ? 'ativo' : ''}`} onClick={() => setAba('escola')}>Feriados da Escola</button>
      </div>

      {erro && <div className="alerta erro">{erro}</div>}
      {sucesso && <div className="alerta sucesso">{sucesso}</div>}

      {/* Aba de feriados nacionais */}
      {aba === 'nacionais' && (
        <div>
          <div className="acoes">
            <button className="btn primario" onClick={handleImportar} disabled={!anoSelecionado || carregando}>
              {carregando ? 'Importando...' : 'Importar todos para o Ano Letivo'}
            </button>
          </div>
          <table className="holiday-table">
            <thead>
              <tr><th>Data</th><th>Descrição</th></tr>
            </thead>
            <tbody>
              {nacionais.map((h, i) => (
                <tr key={i}>
                  <td>{new Date(h.data).toLocaleDateString('pt-BR')}</td>
                  <td>{h.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aba de feriados da escola */}
      {aba === 'escola' && (
        <div>
          <form className="cadastro-form" onSubmit={handleSubmit}>
            <div className="linha dois">
              <div className="campo">
                <label className="rotulo" htmlFor="dataFeriado">Data</label>
                <input id="dataFeriado" type="date" className="entrada" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div className="campo">
                <label className="rotulo" htmlFor="descricaoFeriado">Descrição</label>
                <input id="descricaoFeriado" type="text" className="entrada" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
            </div>
            <div className="acoes">
              <button className="btn primario" type="submit" disabled={carregando}>{carregando ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>

          <table className="holiday-table">
            <thead>
              <tr><th>Data</th><th>Descrição</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {feriados.map(f => (
                <tr key={f.id}>
                  <td>{new Date(f.data).toLocaleDateString('pt-BR')}</td>
                  <td>{f.descricao}</td>
                  <td>
                    <button className="btn secundario" type="button" onClick={() => handleExcluir(f.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FormPage>
  )
}

export default Feriados

