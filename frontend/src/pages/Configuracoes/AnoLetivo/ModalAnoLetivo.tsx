import React, { useEffect, useState } from 'react'
import '../../../styles/Forms.css'
import '../../../styles/CadastrarUsuario.css'
import '../../../styles/Feriados.css'
import Modal from '../../../components/Modal'
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

  const [errosCampo, setErrosCampo] = useState({ descricao: '', inicio: '', fim: '' })


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

  const validar = () => {
    const err = { descricao: '', inicio: '', fim: '' }
    if (descricao.trim() === '') err.descricao = 'Descrição é obrigatória.'
    if (inicio === '') err.inicio = 'Início é obrigatório.'
    if (fim === '') err.fim = 'Fim é obrigatório.'
    if (!err.inicio && !err.fim && inicio > fim) err.fim = 'Fim deve ser posterior ao início.'
    if (!err.inicio && !err.fim && sobrepoe()) err.inicio = 'Período sobreposto.'
    setErrosCampo(err)
    return !err.descricao && !err.inicio && !err.fim
  }

  const handleConfirm = async () => {
    if (!validar()) return
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

  const podeSalvar =
    descricao.trim() !== '' &&
    inicio !== '' &&
    fim !== '' &&
    inicio <= fim &&
    !sobrepoe()

  return (

    <Modal
      open={true}
      title={editando ? 'Editar Ano Letivo' : 'Novo Ano Letivo'}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmLabel="Salvar"
      confirmDisabled={!podeSalvar}
    >
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
      {errosCampo.descricao && <p className="erro">{errosCampo.descricao}</p>}
      <label className="rotulo">
        Início
        <input
          type="date"
          className="entrada"
          value={inicio}
          onChange={e => setInicio(e.target.value)}
        />
      </label>
      {errosCampo.inicio && <p className="erro">{errosCampo.inicio}</p>}
      <label className="rotulo">
        Fim
        <input
          type="date"
          className="entrada"
          value={fim}
          onChange={e => setFim(e.target.value)}
        />
      </label>
      {errosCampo.fim && <p className="erro">{errosCampo.fim}</p>}
    </Modal>

  )
}

export default ModalAnoLetivo

