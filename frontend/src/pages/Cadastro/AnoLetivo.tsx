// Página de cadastro de ano letivo seguindo o padrão visual do cadastro de usuários
import React, { useEffect, useState } from 'react' // Importa React e hooks
import FormPage from '../../components/FormPage' // Componente de layout padronizado
import '../../styles/CadastrarUsuario.css' // Reutiliza o CSS existente
import { // Importa serviços necessários
  AnoLetivo, // Tipo de ano letivo
  Periodo, // Tipo de período
  getAnoLetivos, // Serviço para listar anos
  createAnoLetivo, // Serviço para criar ano
  updateAnoLetivo, // Serviço para atualizar ano
  deleteAnoLetivo, // Serviço para excluir ano
  getPeriodos, // Serviço para listar períodos
  createPeriodo, // Serviço para criar período
  updatePeriodo, // Serviço para atualizar período
  deletePeriodo, // Serviço para excluir período
} from '../../services/anoLetivo'

const AnoLetivoPage: React.FC = () => { // Componente principal
  const [anos, setAnos] = useState<AnoLetivo[]>([]) // Lista de anos cadastrados
  const [selecionado, setSelecionado] = useState<AnoLetivo | null>(null) // Ano atualmente selecionado
  const [ano, setAno] = useState('') // Campo de ano do formulário
  const [ativo, setAtivo] = useState(false) // Campo de ativo do formulário
  const [periodos, setPeriodos] = useState<Periodo[]>([]) // Lista de períodos do ano selecionado
  const [inicio, setInicio] = useState('') // Data de início do período
  const [fim, setFim] = useState('') // Data de fim do período
  const [editPeriodo, setEditPeriodo] = useState<Periodo | null>(null) // Período em edição
  const [erro, setErro] = useState('') // Mensagem de erro do ano
  const [erroPeriodo, setErroPeriodo] = useState('') // Mensagem de erro dos períodos

  useEffect(() => { // Ao montar componente
    getAnoLetivos().then(setAnos).catch(() => setAnos([])) // Carrega anos cadastrados
  }, []) // Executa uma vez

  const editarAno = (a: AnoLetivo) => { // Seleciona um ano para edição
    setSelecionado(a) // Guarda ano selecionado
    setAno(String(a.ano)) // Preenche campo ano
    setAtivo(Boolean(a.ativo)) // Preenche campo ativo
    setErro('') // Limpa erro
    getPeriodos(a.id).then(setPeriodos).catch(() => setPeriodos([])) // Carrega períodos do ano
  }

  const novoAno = () => { // Prepara criação de novo ano
    setSelecionado(null) // Nenhum ano selecionado
    setAno('') // Limpa campo ano
    setAtivo(false) // Desmarca ativo
    setPeriodos([]) // Limpa períodos
    setErro('') // Limpa erro
  }

  const salvarAno = async () => { // Cria ou atualiza ano
    const n = Number(ano) // Converte ano para número
    if (!n) { setErro('Ano inválido.'); return } // Valida ano
    try { // Tenta salvar
      if (selecionado) { // Se já existe
        const atualizado = await updateAnoLetivo(selecionado.id, { ano: n, ativo }) // Atualiza ano
        setAnos(prev => prev.map(x => x.id === atualizado.id ? atualizado : x)) // Atualiza lista
      } else { // Novo ano
        const criado = await createAnoLetivo({ ano: n, ativo }) // Cria ano
        setAnos(prev => [...prev, criado]) // Adiciona à lista
        setSelecionado(criado) // Seleciona novo ano
        getPeriodos(criado.id).then(setPeriodos).catch(() => setPeriodos([])) // Carrega períodos
      }
      setErro('') // Limpa erro
    } catch { // Em caso de falha
      setErro('Falha ao salvar ano letivo.') // Define erro
    }
  }

  const excluirAno = async (id: number) => { // Exclui ano
    try { // Tenta excluir
      await deleteAnoLetivo(id) // Chama serviço de exclusão
      setAnos(prev => prev.filter(x => x.id !== id)) // Remove da lista
      if (selecionado?.id === id) novoAno() // Se estava selecionado limpa form
    } catch { // Ignora falhas
      /* noop */
    }
  }

  const salvarPeriodo = async (e: React.FormEvent) => { // Cria ou atualiza período
    e.preventDefault() // Evita submit padrão
    if (!selecionado) return // Requer ano selecionado
    if (!inicio || !fim) { setErroPeriodo('Datas obrigatórias.'); return } // Validação de campos
    if (inicio > fim) { setErroPeriodo('Data inicial deve ser anterior ou igual à final.'); return } // Validação de datas
    try { // Tenta salvar período
      if (editPeriodo) { // Edição
        await updatePeriodo(editPeriodo.id, { data_inicio: inicio, data_fim: fim }) // Atualiza
      } else { // Novo período
        await createPeriodo(selecionado.id, { data_inicio: inicio, data_fim: fim }) // Cria
      }
      const lista = await getPeriodos(selecionado.id) // Recarrega períodos
      setPeriodos(lista) // Atualiza estado
      setInicio('') // Limpa início
      setFim('') // Limpa fim
      setEditPeriodo(null) // Limpa edição
      setErroPeriodo('') // Limpa erro
    } catch (e: any) { // Captura erro
      if (String(e.message).includes('422')) setErroPeriodo('Períodos sobrepostos.') // Erro de sobreposição
      else setErroPeriodo('Falha ao salvar período.') // Outro erro
    }
  }

  const editarPeriodo = (p: Periodo) => { // Seleciona período para edição
    setEditPeriodo(p) // Guarda período
    setInicio(p.data_inicio) // Preenche início
    setFim(p.data_fim) // Preenche fim
    setErroPeriodo('') // Limpa erro
  }

  const excluirPeriodo = async (id: number) => { // Exclui período
    try { // Tenta excluir
      await deletePeriodo(id) // Chama serviço
      setPeriodos(prev => prev.filter(p => p.id !== id)) // Atualiza lista
    } catch { // Ignora erro
      /* noop */
    }
  }

  const resumo = selecionado // Monta resumo dos períodos
    ? `${selecionado.ano} — [${periodos.map(p => `${new Date(p.data_inicio).toLocaleDateString('pt-BR')}–${new Date(p.data_fim).toLocaleDateString('pt-BR')}`).join('; ')}]`
    : ''

  return ( // Renderização
    <FormPage title="Cadastro de Ano Letivo"> {/* Container padrão */}
      <div className="acoes"> {/* Botões de ação */}
        <button className="btn primario" onClick={novoAno}>Novo</button> {/* Botão novo */}
      </div>
      <table className="holiday-table"> {/* Tabela de anos */}
        <thead>
          <tr><th>Ano</th><th>Ativo</th><th>Ações</th></tr> {/* Cabeçalho */}
        </thead>
        <tbody>
          {anos.map(a => ( // Linhas com anos
            <tr key={a.id}> {/* Linha */}
              <td>{a.ano}</td> {/* Ano */}
              <td>{a.ativo ? 'Sim' : 'Não'}</td> {/* Ativo */}
              <td> {/* Ações */}
                <button className="btn" onClick={() => editarAno(a)}>Editar</button> {/* Editar */}
                <button className="btn" onClick={() => excluirAno(a.id)}>Excluir</button> {/* Excluir */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="linha"> {/* Formulário de ano */}
        <div className="campo">
          <label className="rotulo" htmlFor="ano">Ano</label> {/* Rótulo ano */}
          <input id="ano" className="entrada" type="number" value={ano} onChange={e => setAno(e.target.value)} /> {/* Entrada ano */}
        </div>
        <div className="campo">
          <label className="rotulo" htmlFor="ativo">Ativo</label> {/* Rótulo ativo */}
          <input id="ativo" className="entrada" type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} /> {/* Entrada ativo */}
        </div>
        <div className="campo">
          <button className="btn primario" onClick={salvarAno}>Salvar</button> {/* Botão salvar */}
        </div>
      </div>
      {erro && <div className="alerta erro">{erro}</div>} {/* Exibe erro */}

      {selecionado && ( // Se há ano selecionado
        <div> {/* Seção de períodos */}
          <h3>Períodos do Ano Letivo</h3> {/* Título */}
          {resumo && <p>{resumo}</p>} {/* Resumo */}
          <table className="holiday-table"> {/* Tabela de períodos */}
            <thead>
              <tr><th>Início</th><th>Fim</th><th>Ações</th></tr> {/* Cabeçalho */}
            </thead>
            <tbody>
              {periodos.map(p => ( // Linhas de períodos
                <tr key={p.id}> {/* Linha */}
                  <td>{new Date(p.data_inicio).toLocaleDateString('pt-BR')}</td> {/* Início */}
                  <td>{new Date(p.data_fim).toLocaleDateString('pt-BR')}</td> {/* Fim */}
                  <td> {/* Ações */}
                    <button className="btn" onClick={() => editarPeriodo(p)}>Editar</button> {/* Editar */}
                    <button className="btn" onClick={() => excluirPeriodo(p.id)}>Excluir</button> {/* Excluir */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <form onSubmit={salvarPeriodo}> {/* Formulário de período */}
            <div className="linha"> {/* Linha */}
              <div className="campo">
                <label className="rotulo" htmlFor="inicio">Data início</label> {/* Rótulo início */}
                <input id="inicio" className="entrada" type="date" value={inicio} onChange={e => setInicio(e.target.value)} /> {/* Entrada início */}
              </div>
              <div className="campo">
                <label className="rotulo" htmlFor="fim">Data fim</label> {/* Rótulo fim */}
                <input id="fim" className="entrada" type="date" value={fim} onChange={e => setFim(e.target.value)} /> {/* Entrada fim */}
              </div>
              <div className="campo">
                <button className="btn primario" type="submit">Salvar período</button> {/* Botão salvar período */}
              </div>
            </div>
          </form>
          {erroPeriodo && <div className="alerta erro">{erroPeriodo}</div>} {/* Erro período */}
        </div>
      )}
    </FormPage>
  )
}

export default AnoLetivoPage // Exporta componente
