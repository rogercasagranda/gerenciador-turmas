// Página de cadastro de feriados
import React, { useEffect, useState } from 'react'

import FormPage from '../../components/FormPage'

import '../../styles/CadastrarUsuario.css'
import '../../styles/Feriados.css'
import '../../styles/Forms.css'
import { AnoLetivo, getAnoLetivos } from '../../services/anoLetivo'
import { Feriado, getFeriados, createFeriado, deleteFeriado } from '../../services/feriados'

interface LinhaImportada {
  ano: number
  data: string
  descricao: string
  erro?: string
}

// Formata data para dd/mm/aaaa
const formatar = (data: string) => new Date(data).toLocaleDateString('pt-BR')

const Feriados: React.FC = () => {
  const [anos, setAnos] = useState<AnoLetivo[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [carregado, setCarregado] = useState(false)

  // Estados do modal de novo feriado
  const [formAberto, setFormAberto] = useState(false)
  const [anoId, setAnoId] = useState('')
  const [data, setData] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')
  // Estados da importação
  const [importAberto, setImportAberto] = useState(false)
  const [linhas, setLinhas] = useState<LinhaImportada[]>([])


  // Busca anos e feriados
  useEffect(() => {
    getAnoLetivos()
      .then(setAnos)
      .catch(() => setAnos([]))
  }, [])

  useEffect(() => {
    const carregar = async () => {
      const todos: Feriado[] = []
      for (const ano of anos) {
        try {
          const lista = await getFeriados(ano.id)
          todos.push(...lista)
        } catch {
          /* ignora erros individuais */
        }
      }
      todos.sort((a, b) => a.data.localeCompare(b.data))
      setFeriados(todos)
      setCarregado(true)
    }
    if (anos.length) carregar()
    else setCarregado(true)
  }, [anos])

  // Manipulação de feriados
  const abrirNovo = () => {
    setAnoId('')
    setData('')
    setDescricao('')
    setErro('')

    setFormAberto(true)
  }

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    try {
      await createFeriado({ ano_letivo_id: Number(anoId), data, descricao, origem: 'ESCOLA' })
      setFormAberto(false)

      // Recarrega anos/feriados
      const a = await getAnoLetivos()
      setAnos(a)
    } catch (err: any) {
      const msg = String(err.message)
      if (msg.includes('409')) setErro('Feriado já cadastrado.')
      else if (msg.includes('422')) setErro('Dados inválidos.')
      else setErro('Falha ao salvar feriado.')

    }
  }

  const excluir = async (id?: number) => {
    if (!id) return
    await deleteFeriado(id)
    setFeriados(prev => prev.filter(f => f.id !== id))
  }

  // Importação de CSV
  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const texto = String(e.target?.result || '')
      const sep = texto.includes('|') ? '|' : texto.includes(';') ? ';' : ','
      const linhasBrutas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      const dados: LinhaImportada[] = []
      linhasBrutas.slice(1).forEach(l => {
        const partes = l.split(sep).map(p => p.trim())
        if (partes.length < 3) {
          dados.push({ ano: 0, data: '', descricao: '', erro: 'Formato inválido' })
          return
        }
        const [a, d, desc] = partes
        const ano = anos.find(an => String(an.id) === a)
        if (!ano) {
          dados.push({ ano: Number(a), data: d, descricao: desc, erro: 'Ano inválido' })
          return
        }
        const dt = new Date(d)
        const dentro = dt >= new Date(ano.data_inicio) && dt <= new Date(ano.data_fim)
        if (isNaN(dt.getTime()) || !dentro) {
          dados.push({ ano: ano.id, data: d, descricao: desc, erro: 'Data fora do ano' })
          return
        }
        if (!desc) {
          dados.push({ ano: ano.id, data: d, descricao: desc, erro: 'Descrição obrigatória' })
          return
        }
        dados.push({ ano: ano.id, data: d, descricao: desc })
      })
      setLinhas(dados)
    }
    reader.readAsText(file)
  }


  const salvarImport = async () => {
    for (const l of linhas.filter(l => !l.erro)) {
      await createFeriado({ ano_letivo_id: l.ano, data: l.data, descricao: l.descricao, origem: 'ESCOLA' })
    }
    setImportAberto(false)
    const a = await getAnoLetivos()
    setAnos(a)

  }

  const total = linhas.length
  const validas = linhas.filter(l => !l.erro).length
  const erros = total - validas


  return (
    <FormPage title="Cadastro de Feriados">
      <div className="acoes">
        <button className="btn secundario" onClick={() => { setLinhas([]); setImportAberto(true) }}>Importar Feriados</button>
        <button className="btn primario" onClick={abrirNovo}>+ Novo Feriado</button>
      </div>


      {carregado && feriados.length === 0 && <p>Nenhum feriado cadastrado.</p>}

      {feriados.length > 0 && (
        <table className="holiday-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {feriados.map(f => (
              <tr key={f.id}>
                <td>{formatar(f.data)}</td>
                <td>{f.descricao}</td>
                <td>

                  <button className="btn perigo" onClick={() => excluir(f.id)}>Excluir</button>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {formAberto && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={salvar}>
            <h3>Novo Feriado</h3>
            {erro && <div className="alerta erro">{erro}</div>}
            <label className="rotulo">
              Ano letivo
              <select className="entrada" value={anoId} onChange={e => setAnoId(e.target.value)}>
                <option value="">Selecione</option>
                {anos.map(a => (
                  <option key={a.id} value={a.id}>{a.descricao}</option>
                ))}
              </select>
            </label>
            <label className="rotulo">
              Dia do feriado
              <input type="date" className="entrada" value={data} onChange={e => setData(e.target.value)} />
            </label>
            <label className="rotulo">
              Descrição
              <input type="text" className="entrada" value={descricao} onChange={e => setDescricao(e.target.value)} />
            </label>
            <div className="modal-acoes">

              <button type="button" className="btn secundario" onClick={() => setFormAberto(false)}>Cancelar</button>
              <button type="submit" className="btn primario" disabled={!anoId || !data || !descricao.trim()}>Salvar</button>

            </div>
          </form>
        </div>
      )}

      {importAberto && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true">
            <h3>Importar feriados</h3>
            <p>Exemplo: Ano|data|descrição</p>
            <input type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            {linhas.length > 0 && (
              <>
                <table className="holiday-table">
                  <thead>
                    <tr>
                      <th>Ano</th>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l, i) => (
                      <tr key={i}>
                        <td>{l.ano}</td>
                        <td>{l.data}</td>
                        <td>{l.descricao}</td>
                        <td>{l.erro ? l.erro : 'OK'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="resumo">Total: {total} | Válidas: {validas} | Erro: {erros}</div>
              </>
            )}
            <div className="modal-acoes">
res
              <button className="btn secundario" type="button" onClick={() => setImportAberto(false)}>Cancelar</button>
              <button className="btn primario" type="button" onClick={salvarImport} disabled={validas === 0}>Salvar</button>

            </div>
          </div>
        </div>
      )}

    </FormPage>

  )
}

export default Feriados

