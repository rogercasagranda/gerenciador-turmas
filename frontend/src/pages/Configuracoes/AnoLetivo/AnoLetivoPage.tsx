import React, { useEffect, useState } from 'react'
import ListPage from '../../../components/ListPage'
import '../../../styles/CadastrarUsuario.css'

import { AnoLetivo, getAnoLetivos } from '../../../services/anoLetivo'

const formatar = (data: string) => new Date(data).toLocaleDateString('pt-BR')

const AnoLetivoPage: React.FC = () => {
  const [anos, setAnos] = useState<AnoLetivo[]>([])
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    getAnoLetivos()
      .then(setAnos)
      .catch(() => setAnos([]))
      .finally(() => setCarregado(true))
  }, [])

  const novo = <button className="btn primario button">Novo</button>

  return (
    <ListPage title="Anos Letivos" actions={novo}>
      {!carregado && <p className="carregando">Carregando...</p>}
      {carregado && anos.length === 0 && <p>Nenhum ano letivo cadastrado.</p>}
      {anos.length > 0 && (

        <table className="holiday-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Início</th>
              <th>Fim</th>

              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {anos.map(a => (
              <tr key={a.id}>
                <td>{a.descricao}</td>
                <td>{formatar(a.data_inicio)}</td>
                <td>{formatar(a.data_fim)}</td>
                <td>
                  <button className="btn secundario" onClick={() => {}}>Editar</button>
                  <button className="btn perigo" onClick={() => {}}>Excluir</button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ListPage>
  )
}

export default AnoLetivoPage
