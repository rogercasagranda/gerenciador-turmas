// Importa React
import React, { useEffect, useState } from 'react'
// Importa serviço para buscar dados
import { list } from '../../services/crud'

// Componente de turnos
const Turnos: React.FC = () => {
  // Guarda lista de turnos retornados pelo backend
  const [turnos, setTurnos] = useState<string[]>([])
  // Armazena mensagens de erro
  const [erro, setErro] = useState('')

  // Ao montar, busca os turnos
  useEffect(() => {
    list<string>('turnos').then(setTurnos).catch(e => setErro(e.message))
  }, [])

  // Renderização
  return (
    <section className="cadastro-page"> {/* Container principal */}
      <h2>Turnos</h2> {/* Título */}
      {erro && <div className="alerta erro">{erro}</div>} {/* Erro do backend */}

      {/* Lista os turnos disponíveis */}
      <ul className="cadastro-list">
        {turnos.map(t => (
          <li key={t} className="cadastro-item">{t}</li>
        ))}
      </ul>

      {/* Placeholder para horários */}
      <p>Horários: funcionalidade em desenvolvimento.</p>
    </section>
  )
}

// Exporta componente
export default Turnos
