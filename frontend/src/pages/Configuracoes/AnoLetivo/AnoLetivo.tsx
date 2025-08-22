import React, { useEffect, useState } from 'react'
import ListPage from '../../../components/ListPage'
import '../../../styles/CadastrarUsuario.css'
import '../../../styles/Feriados.css'
import '../../../styles/Forms.css'
import { AnoLetivo, getAnoLetivos, deleteAnoLetivo } from '../../../services/anoLetivo'
import ModalAnoLetivo from './ModalAnoLetivo'

const AnoLetivoPage: React.FC = () => {
  const [lista, setLista] = useState<AnoLetivo[]>([])
  const [carregado, setCarregado] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<AnoLetivo | undefined>(undefined)

  useEffect(() => {
    getAnoLetivos()
      .then(a => { setLista(a); setCarregado(true) })
      .catch(() => { setLista([]); setCarregado(true) })
  }, [])

  const abrirNovo = () => {
    setEditando(undefined)
    setModalAberto(true)
  }

  const abrirEditar = (a: AnoLetivo) => {
    setEditando(a)
    setModalAberto(true)
  }

  const salvar = (a: AnoLetivo) => {
    setLista(prev => {
      const idx = prev.findIndex(x => x.id === a.id)
      if (idx >= 0) {
        const copia = [...prev]
        copia[idx] = a
        return copia
      }
      return [...prev, a]
    })
  }

  const excluir = async (id: number) => {
    try {
      await deleteAnoLetivo(id)
      setLista(prev => prev.filter(a => a.id !== id))
    } catch {}
  }

  const botoes = (
      <button className="btn btn-md primario" onClick={abrirNovo}>+ Novo Ano Letivo</button>
  )

  return (
    <ListPage title="Cadastro de Ano Letivo" actions={botoes}>
      {carregado && lista.length === 0 && <p>Nenhum ano letivo cadastrado.</p>}

      {lista.length > 0 && (
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
            {lista.map(a => (
              <tr key={a.id}>
                <td>{a.descricao}</td>
                <td>{new Date(a.data_inicio).toLocaleDateString('pt-BR')}</td>
                <td>{new Date(a.data_fim).toLocaleDateString('pt-BR')}</td>
                <td>
                    <button className="btn btn-md" onClick={() => abrirEditar(a)}>Editar</button>
                    <button className="btn btn-md perigo" onClick={() => excluir(a.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalAberto && (
        <ModalAnoLetivo
          anos={lista}
          editando={editando}
          onClose={() => setModalAberto(false)}
          onSaved={salvar}
        />
      )}
    </ListPage>
  )
}

export default AnoLetivoPage

