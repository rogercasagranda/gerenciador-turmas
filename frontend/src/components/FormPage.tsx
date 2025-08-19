import React from 'react'
import '../styles/CadastrarUsuario.css'

// Componente base para páginas de formulário
interface FormPageProps {
  // Título exibido no topo da página
  title: string
  // Conteúdo principal da página (formulários, etc.)
  children: React.ReactNode
}

// Estrutura reutilizável com container e título padronizados
const FormPage: React.FC<FormPageProps> = ({ title, children }) => {
  return (
    <section className="cadastro-wrapper">
      <h2 className="cadastro-titulo">{title}</h2>
      {children}
    </section>
  )
}

export default FormPage
