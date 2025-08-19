// Importa React e hooks
import React, { useEffect, useState } from 'react'
// Importa funções de CRUD para comunicação com o backend
import { list, create, update, remove } from '../../services/crud'

// Tipagens básicas
interface Turma { id: number; nome: string; disciplina_id: number; professor_id: number; turno: string }
interface Disciplina { id: number; nome: string }
interface Professor { id: number; nome: string }
interface Aluno { id: number; nome: string }
interface Horario { id: number; dia: string; hora: string }

// Componente principal
const Turmas: React.FC = () => {
  // Lista de turmas cadastradas
  const [turmas, setTurmas] = useState<Turma[]>([])
  // Disciplinas e professores para selects
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  // Campos da turma
  const [nome, setNome] = useState('')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [turno, setTurno] = useState('')
  // Controle de edição
  const [editando, setEditando] = useState<number | null>(null)
  // Armazena erros
  const [erro, setErro] = useState('')
  // Aba selecionada: dados | alunos | horarios
  const [aba, setAba] = useState<'dados' | 'alunos' | 'horarios'>('dados')

  // Estado para alunos da turma
  const [alunosTurma, setAlunosTurma] = useState<Aluno[]>([])
  const [todosAlunos, setTodosAlunos] = useState<Aluno[]>([])
  const [novoAluno, setNovoAluno] = useState('')

  // Estado para horários da turma
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [dia, setDia] = useState('')
  const [hora, setHora] = useState('')

  // Carrega dados iniciais
  useEffect(() => {
    list<Turma>('turmas').then(setTurmas).catch(e => setErro(e.message))
    list<Disciplina>('disciplinas').then(setDisciplinas).catch(e => setErro(e.message))
    list<Professor>('professores').then(setProfessores).catch(e => setErro(e.message))
    list<Aluno>('alunos').then(setTodosAlunos).catch(e => setErro(e.message))
  }, [])

  // Carrega alunos da turma quando muda aba
  useEffect(() => {
    if (editando && aba === 'alunos') {
      list<Aluno>(`turmas/${editando}/alunos`).then(setAlunosTurma).catch(e => setErro(e.message))
    }
  }, [editando, aba])

  // Carrega horários da turma
  useEffect(() => {
    if (editando && aba === 'horarios') {
      list<Horario>(`turmas/${editando}/horarios`).then(setHorarios).catch(e => setErro(e.message))
    }
  }, [editando, aba])

  // Submete formulário da turma
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setErro('')
      const payload = { nome, disciplina_id: Number(disciplinaId), professor_id: Number(professorId), turno }
      if (editando) await update('turmas', editando, payload)
      else await create('turmas', payload)
      setTurmas(await list<Turma>('turmas'))
      setNome(''); setDisciplinaId(''); setProfessorId(''); setTurno(''); setEditando(null)
    } catch (e: any) {
      setErro(e.message)
    }
  }

  // Inicia edição
  const editar = (t: Turma) => {
    setNome(t.nome)
    setDisciplinaId(String(t.disciplina_id))
    setProfessorId(String(t.professor_id))
    setTurno(t.turno)
    setEditando(t.id)
    setAba('dados')
  }

  // Exclui turma
  const excluir = async (id: number) => {
    try {
      setErro('')
      await remove('turmas', id)
      setTurmas(turmas.filter(t => t.id !== id))
    } catch (e: any) {
      setErro(e.message)
    }
  }

  // Adiciona aluno na turma
  const adicionarAluno = async () => {
    if (!editando) return
    try {
      setErro('')
      await create(`turmas/${editando}/alunos`, { aluno_id: Number(novoAluno) })
      setAlunosTurma(await list<Aluno>(`turmas/${editando}/alunos`))
      setNovoAluno('')
    } catch (e: any) {
      setErro(e.message)
    }
  }

  // Remove aluno
  const removerAluno = async (id: number) => {
    if (!editando) return
    try {
      setErro('')
      await remove(`turmas/${editando}/alunos`, id)
      setAlunosTurma(alunosTurma.filter(a => a.id !== id))
    } catch (e: any) {
      setErro(e.message)
    }
  }

  // Adiciona horário
  const adicionarHorario = async () => {
    if (!editando) return
    try {
      setErro('')
      await create(`turmas/${editando}/horarios`, { dia, hora })
      setHorarios(await list<Horario>(`turmas/${editando}/horarios`))
      setDia(''); setHora('')
    } catch (e: any) {
      setErro(e.message)
    }
  }

  // Remove horário
  const removerHorario = async (id: number) => {
    if (!editando) return
    try {
      setErro('')
      await remove(`turmas/${editando}/horarios`, id)
      setHorarios(horarios.filter(h => h.id !== id))
    } catch (e: any) {
      setErro(e.message)
    }
  }

  // Renderização
  return (
    <section className="cadastro-page"> {/* Container principal */}
      <h2>Cadastro de Turmas</h2> {/* Título */}
      {erro && <div className="alerta erro">{erro}</div>} {/* Exibe erros */}

      {/* Lista de turmas */}
      <ul className="cadastro-list">
        {turmas.map(t => (
          <li key={t.id} className="cadastro-item">
            <span>{t.nome}</span>
            <button onClick={() => editar(t)}>Editar</button>
            <button onClick={() => excluir(t.id)}>Excluir</button>
          </li>
        ))}
      </ul>

      {/* Formulário principal */}
      {aba === 'dados' && (
        <form className="cadastro-form" onSubmit={handleSubmit}>
          <div className="campo">
            <label className="rotulo" htmlFor="nome">Nome</label>
            <input id="nome" className="entrada" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="campo">
            <label className="rotulo" htmlFor="disciplina">Disciplina</label>
            <select id="disciplina" className="entrada" value={disciplinaId} onChange={e => setDisciplinaId(e.target.value)} required>
              <option value="">Selecione</option>
              {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label className="rotulo" htmlFor="professor">Professor</label>
            <select id="professor" className="entrada" value={professorId} onChange={e => setProfessorId(e.target.value)} required>
              <option value="">Selecione</option>
              {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div className="campo">
            <label className="rotulo" htmlFor="turno">Turno</label>
            <input id="turno" className="entrada" value={turno} onChange={e => setTurno(e.target.value)} required />
          </div>
          <button className="botao" type="submit">{editando ? 'Atualizar' : 'Adicionar'}</button>
          {editando && (
            <div className="botoes">
              <button type="button" onClick={() => setAba('alunos')}>Alunos</button>
              <button type="button" onClick={() => setAba('horarios')}>Horários</button>
            </div>
          )}
        </form>
      )}

      {/* Aba alunos */}
      {aba === 'alunos' && editando && (
        <div className="cadastro-form">
          <h3>Alunos da Turma</h3>
          <ul className="cadastro-list">
            {alunosTurma.map(a => (
              <li key={a.id} className="cadastro-item">
                <span>{a.nome}</span>
                <button onClick={() => removerAluno(a.id)}>Remover</button>
              </li>
            ))}
          </ul>
          <div className="campo">
            <label className="rotulo" htmlFor="novoAluno">Adicionar aluno</label>
            <select id="novoAluno" className="entrada" value={novoAluno} onChange={e => setNovoAluno(e.target.value)}>
              <option value="">Selecione</option>
              {todosAlunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div className="botoes">
            <button type="button" onClick={adicionarAluno}>Adicionar</button>
            <button type="button" onClick={() => setAba('dados')}>Voltar</button>
          </div>
        </div>
      )}

      {/* Aba horários */}
      {aba === 'horarios' && editando && (
        <div className="cadastro-form">
          <h3>Horários da Turma</h3>
          <ul className="cadastro-list">
            {horarios.map(h => (
              <li key={h.id} className="cadastro-item">
                <span>{h.dia} {h.hora}</span>
                <button onClick={() => removerHorario(h.id)}>Remover</button>
              </li>
            ))}
          </ul>
          <div className="campo">
            <label className="rotulo" htmlFor="dia">Dia</label>
            <input id="dia" className="entrada" value={dia} onChange={e => setDia(e.target.value)} />
          </div>
          <div className="campo">
            <label className="rotulo" htmlFor="hora">Hora</label>
            <input id="hora" className="entrada" value={hora} onChange={e => setHora(e.target.value)} />
          </div>
          <div className="botoes">
            <button type="button" onClick={adicionarHorario}>Adicionar</button>
            <button type="button" onClick={() => setAba('dados')}>Voltar</button>
          </div>
        </div>
      )}
    </section>
  )
}

// Exporta componente
export default Turmas
