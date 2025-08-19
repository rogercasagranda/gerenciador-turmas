// Importa React e hooks para estado e ciclo de vida
import React, { useEffect, useState } from 'react'
// Importa funções genéricas de CRUD para comunicação com o backend
import { list, create, update, remove } from '../../services/crud'

// Define a estrutura de uma disciplina
interface Disciplina { id: number; nome: string; professor_id: number }
// Estrutura de um professor para popular o select
interface Professor { id: number; nome: string }

// Componente principal de disciplinas
const Disciplinas: React.FC = () => {
  // Estado com todas as disciplinas cadastradas
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  // Estado com todos os professores disponíveis
  const [professores, setProfessores] = useState<Professor[]>([])
  // Campo de nome da disciplina
  const [nome, setNome] = useState('')
  // Campo com o id do professor responsável
  const [professorId, setProfessorId] = useState('')
  // Estado para armazenar mensagens de erro do backend
  const [erro, setErro] = useState('')
  // Estado que guarda o id que está sendo editado (se existir)
  const [editando, setEditando] = useState<number | null>(null)

  // Carrega disciplinas e professores ao montar o componente
  useEffect(() => {
    // Busca disciplinas existentes
    list<Disciplina>('disciplinas').then(setDisciplinas).catch(e => setErro(e.message))
    // Busca professores para o select de responsável
    list<Professor>('professores').then(setProfessores).catch(e => setErro(e.message))
  }, [])

  // Envia dados do formulário para criar ou atualizar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Evita recarregar página
    try {
      setErro('') // Limpa mensagens anteriores
      // Dados comuns enviados ao backend
      const payload = { nome, professor_id: Number(professorId) }
      // Verifica se está editando ou criando
      if (editando) await update('disciplinas', editando, payload)
      else await create('disciplinas', payload)
      // Recarrega lista após operação
      const dados = await list<Disciplina>('disciplinas')
      setDisciplinas(dados)
      // Limpa campos e estado de edição
      setNome(''); setProfessorId(''); setEditando(null)
    } catch (e: any) {
      setErro(e.message) // Mostra mensagem de erro vinda do backend
    }
  }

  // Prepara formulário para edição
  const editar = (d: Disciplina) => {
    setNome(d.nome) // Preenche nome
    setProfessorId(String(d.professor_id)) // Preenche professor
    setEditando(d.id) // Define id sendo editado
  }

  // Remove uma disciplina
  const excluir = async (id: number) => {
    try {
      setErro('') // Limpa erros
      await remove('disciplinas', id) // Chama API de remoção
      setDisciplinas(disciplinas.filter(d => d.id !== id)) // Atualiza lista local
    } catch (e: any) {
      setErro(e.message) // Exibe erro caso ocorra
    }
  }

  // Renderiza componente
  return (
    <section className="cadastro-page"> {/* Container principal */}
      <h2>Cadastro de Disciplinas</h2> {/* Título */}
      {erro && <div className="alerta erro">{erro}</div>} {/* Mensagem de erro */}

      {/* Lista de disciplinas */}
      <ul className="cadastro-list">
        {disciplinas.map(d => (
          <li key={d.id} className="cadastro-item">
            <span>{d.nome}</span> {/* Nome da disciplina */}
            <button onClick={() => editar(d)}>Editar</button> {/* Botão editar */}
            <button onClick={() => excluir(d.id)}>Excluir</button> {/* Botão excluir */}
          </li>
        ))}
      </ul>

      {/* Formulário de criação/edição */}
      <form className="cadastro-form" onSubmit={handleSubmit}>
        <div className="campo">
          <label className="rotulo" htmlFor="nome">Nome</label> {/* Rótulo */}
          <input id="nome" className="entrada" value={nome} onChange={e => setNome(e.target.value)} required /> {/* Entrada nome */}
        </div>

        <div className="campo">
          <label className="rotulo" htmlFor="professor">Professor responsável</label> {/* Rótulo */}
          <select id="professor" className="entrada" value={professorId} onChange={e => setProfessorId(e.target.value)} required>
            <option value="">Selecione</option> {/* Opção vazia */}
            {professores.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option> // Opções do select
            ))}
          </select>
        </div>

        <button className="botao" type="submit">{editando ? 'Atualizar' : 'Adicionar'}</button> {/* Botão enviar */}
      </form>
    </section>
  )
}

// Exporta componente
export default Disciplinas
