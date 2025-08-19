// Importa React
import React, { useEffect, useState } from 'react'
// Importa utilitários de CRUD
import { list, create, update, remove } from '../../services/crud'

// Tipagem de responsável
interface Responsavel { id: number; nome: string; aluno_id: number }
// Tipagem de aluno
interface Aluno { id: number; nome: string }

// Componente de responsáveis
const Responsaveis: React.FC = () => {
  // Lista de responsáveis
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([])
  // Lista de alunos para vinculação
  const [alunos, setAlunos] = useState<Aluno[]>([])
  // Campos do formulário
  const [nome, setNome] = useState('')
  const [alunoId, setAlunoId] = useState('')
  // Id em edição
  const [editando, setEditando] = useState<number | null>(null)
  // Mensagem de erro
  const [erro, setErro] = useState('')

  // Carrega responsáveis e alunos
  useEffect(() => {
    list<Responsavel>('responsaveis').then(setResponsaveis).catch(e => setErro(e.message))
    list<Aluno>('alunos').then(setAlunos).catch(e => setErro(e.message))
  }, [])

  // Submete formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setErro('')
      const payload = { nome, aluno_id: Number(alunoId) }
      if (editando) await update('responsaveis', editando, payload)
      else await create('responsaveis', payload)
      setResponsaveis(await list<Responsavel>('responsaveis'))
      setNome(''); setAlunoId(''); setEditando(null)
    } catch (e: any) {
      setErro(e.message)
    }
  }

  // Prepara edição
  const editar = (r: Responsavel) => {
    setNome(r.nome)
    setAlunoId(String(r.aluno_id))
    setEditando(r.id)
  }

  // Remove
  const excluir = async (id: number) => {
    try {
      setErro('')
      await remove('responsaveis', id)
      setResponsaveis(responsaveis.filter(r => r.id !== id))
    } catch (e: any) {
      setErro(e.message)
    }
  }

  // JSX
  return (
    <section className="cadastro-page"> {/* Container */}
      <h2>Cadastro de Responsáveis</h2> {/* Título */}
      {erro && <div className="alerta erro">{erro}</div>} {/* Erro */}

      {/* Lista de responsáveis */}
      <ul className="cadastro-list">
        {responsaveis.map(r => (
          <li key={r.id} className="cadastro-item">
            <span>{r.nome}</span> {/* Nome */}
            <button onClick={() => editar(r)}>Editar</button> {/* Editar */}
            <button onClick={() => excluir(r.id)}>Excluir</button> {/* Excluir */}
          </li>
        ))}
      </ul>

      {/* Formulário */}
      <form className="cadastro-form" onSubmit={handleSubmit}>
        <div className="campo">
          <label className="rotulo" htmlFor="nome">Nome</label>
          <input id="nome" className="entrada" value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div className="campo">
          <label className="rotulo" htmlFor="aluno">Aluno vinculado</label>
          <select id="aluno" className="entrada" value={alunoId} onChange={e => setAlunoId(e.target.value)} required>
            <option value="">Selecione</option>
            {alunos.map(a => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </div>
        <button className="botao" type="submit">{editando ? 'Atualizar' : 'Adicionar'}</button>
      </form>
    </section>
  )
}

// Exporta componente
export default Responsaveis
