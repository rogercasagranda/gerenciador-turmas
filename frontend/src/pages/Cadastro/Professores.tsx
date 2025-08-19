// Importa React e hooks
import React, { useEffect, useState } from 'react'
// Importa as funções genéricas do serviço CRUD
import { list, create, update, remove } from '../../services/crud'

// Estrutura de um professor
interface Professor { id: number; nome: string; email: string }

// Componente de cadastro de professores
const Professores: React.FC = () => {
  // Lista de professores cadastrados
  const [professores, setProfessores] = useState<Professor[]>([])
  // Campos do formulário
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  // Guarda o id em edição
  const [editando, setEditando] = useState<number | null>(null)
  // Mensagens de erro do backend
  const [erro, setErro] = useState('')

  // Carrega professores ao montar
  useEffect(() => {
    list<Professor>('professores').then(setProfessores).catch(e => setErro(e.message))
  }, [])

  // Envia dados do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Evita reload
    try {
      setErro('') // Limpa erros
      const payload = { nome, email } // Dados da requisição
      if (editando) await update('professores', editando, payload) // Atualiza
      else await create('professores', payload) // Cria
      setProfessores(await list<Professor>('professores')) // Recarrega lista
      setNome(''); setEmail(''); setEditando(null) // Limpa campos
    } catch (e: any) {
      setErro(e.message) // Exibe erro
    }
  }

  // Prepara edição
  const editar = (p: Professor) => {
    setNome(p.nome) // Preenche nome
    setEmail(p.email) // Preenche email
    setEditando(p.id) // Armazena id
  }

  // Remove professor
  const excluir = async (id: number) => {
    try {
      setErro('') // Limpa erros
      await remove('professores', id) // Chama API
      setProfessores(professores.filter(p => p.id !== id)) // Atualiza lista
    } catch (e: any) {
      setErro(e.message) // Exibe erro
    }
  }

  // JSX
  return (
    <section className="cadastro-page"> {/* Container */}
      <h2>Cadastro de Professores</h2> {/* Título */}
      {erro && <div className="alerta erro">{erro}</div>} {/* Erro */}

      {/* Lista */}
      <ul className="cadastro-list">
        {professores.map(p => (
          <li key={p.id} className="cadastro-item">
            <span>{p.nome} - {p.email}</span> {/* Nome e email */}
            <button onClick={() => editar(p)}>Editar</button> {/* Editar */}
            <button onClick={() => excluir(p.id)}>Excluir</button> {/* Excluir */}
          </li>
        ))}
      </ul>

      {/* Formulário */}
      <form className="cadastro-form" onSubmit={handleSubmit}>
        <div className="campo">
          <label className="rotulo" htmlFor="nome">Nome</label> {/* Rótulo */}
          <input id="nome" className="entrada" value={nome} onChange={e => setNome(e.target.value)} required /> {/* Nome */}
        </div>
        <div className="campo">
          <label className="rotulo" htmlFor="email">Email</label> {/* Rótulo */}
          <input id="email" className="entrada" type="email" value={email} onChange={e => setEmail(e.target.value)} required /> {/* Email */}
        </div>
        <button className="botao" type="submit">{editando ? 'Atualizar' : 'Adicionar'}</button> {/* Submit */}
      </form>
    </section>
  )
}

// Exporta componente
export default Professores
