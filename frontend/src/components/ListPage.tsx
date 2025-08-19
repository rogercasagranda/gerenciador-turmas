import React from 'react'
import '../styles/CadastrarUsuario.css'

// Componente base para páginas de listagem
interface ListPageProps {
  // Título da página
  title: string
  // Ações opcionais exibidas ao lado do título
  actions?: React.ReactNode
  // Conteúdo principal
  children: React.ReactNode
}

// Estrutura de lista padronizada reutilizável
const ListPage: React.FC<ListPageProps> = ({ title, actions, children }) => {
  return (
    <section className="cadastro-wrapper">
      <div className="cabecalho-lista">
        <h2 className="cadastro-titulo">{title}</h2>
        {actions && <div className="acoes">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

export default ListPage
