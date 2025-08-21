import React, { useEffect, useState } from 'react'
import ListPage from '../../../components/ListPage'
import '../../../styles/CadastrarUsuario.css'
import '../../../styles/Forms.css'
import { AnoLetivo, getAnoLetivos } from '../../../services/anoLetivo'

const AnoLetivoPage: React.FC = () => {
  const [lista, setLista] = useState<AnoLetivo[]>([])

  useEffect(() => {
    getAnoLetivos()
      .then(setLista)
      .catch(() => setLista([]))
  }, [])

  return (
    <ListPage title="Anos Letivos">
      {lista.length === 0 ? (
        <p>Nenhum ano letivo cadastrado.</p>
      ) : (
        <table className="holiday-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Início</th>
              <th>Fim</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(a => (
              <tr key={a.id}>
                <td>{a.descricao}</td>
                <td>{new Date(a.data_inicio).toLocaleDateString('pt-BR')}</td>
                <td>{new Date(a.data_fim).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListPage>
  )
}

export default AnoLetivoPage
