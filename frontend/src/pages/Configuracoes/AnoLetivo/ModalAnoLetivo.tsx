import React, { useEffect, useState } from 'react'
import '../../../styles/Forms.css'
import '../../../styles/CadastrarUsuario.css'
import '../../../styles/Feriados.css'
import { AnoLetivo, createAnoLetivo, updateAnoLetivo } from '../../../services/anoLetivo'
import ErrorPopup from '../../../components/ErrorPopup'

interface Props {
  anos: AnoLetivo[]
  editando?: AnoLetivo
  onClose: () => void
  onSaved: (a: AnoLetivo) => void
}

const ModalAnoLetivo: React.FC<Props> = ({ anos, editando, onClose, onSaved }) => {
  const [descricao, setDescricao] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [erro, setErro] = useState('')
  const [semPermissao, setSemPermissao] = useState(false)

  useEffect(() => {
    setDescricao(editando?.descricao ?? '')
    setInicio(editando ? editando.data_inicio.slice(0, 10) : '')
    setFim(editando ? editando.data_fim.slice(0, 10) : '')
    setErro('')
  }, [editando])

  const sobrepoe = () => {
    return anos.some(a => {
      if (editando && a.id === editando.id) return false
      const ini = inicio
      const fi = fim
      const ai = a.data_inicio.slice(0, 10)
      const af = a.data_fim.slice(0, 10)
      return !(fi < ai || ini > af)
    })
  }

  const podeSalvar =
    descricao.trim() !== '' &&
    inicio !== '' &&
    fim !== '' &&
    inicio <= fim &&
    !sobrepoe()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!podeSalvar) return
    const dto = { descricao: descricao.trim(), data_inicio: inicio, data_fim: fim }
    try {
      let salvo: AnoLetivo
      if (editando) salvo = await updateAnoLetivo(editando.id, dto)
      else salvo = await createAnoLetivo(dto)
      onSaved(salvo)
      onClose()
    } catch (err: any) {
      const msg = String(err.message)
      if (msg.includes('409')) setErro('Descrição duplicada.')
      else if (msg.includes('422')) setErro('Datas inválidas.')
      else if (msg.includes('403')) setSemPermissao(true)
      else setErro('Falha ao salvar ano letivo.')
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={handleSubmit}>
        <h3>{editando ? 'Editar Ano Letivo' : 'Novo Ano Letivo'}</h3>
        {erro && <div className="alerta erro">{erro}</div>}
        <label className="rotulo">
          Ano letivo
          <input
            type="text"
            className="entrada"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
          />
        </label>
        <label className="rotulo">
          Início
          <input
            type="date"
            className="entrada"
            value={inicio}
            onChange={e => setInicio(e.target.value)}
          />
        </label>
        <label className="rotulo">
          Fim
          <input
            type="date"
            className="entrada"
            value={fim}
            onChange={e => setFim(e.target.value)}
          />
        </label>
        <div className="modal-acoes">
          <button type="button" className="btn secundario" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn primario button" disabled={!podeSalvar}>
            Salvar
          </button>
        </div>
      </form>
      {semPermissao && (
        <ErrorPopup message="Sem permissão." onClose={() => setSemPermissao(false)} />
      )}
    </div>
  )
}

export default ModalAnoLetivo

