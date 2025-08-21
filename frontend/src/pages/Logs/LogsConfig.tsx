import React, { useEffect, useState } from 'react'
import useDirtyForm from '@/hooks/useDirtyForm'
import { cadastrarConfig } from '@/services/logs'
import '../../styles/Logs.css'

const CRUD_OPTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'] as const
export type CrudAction = (typeof CRUD_OPTIONS)[number]

interface Props {
  initialScreen?: string
}

const LogsConfig: React.FC<Props> = ({ initialScreen }) => {
  const [tela, setTela] = useState(initialScreen || '')
  const [crud, setCrud] = useState<CrudAction[]>([])
  const [mensagem, setMensagem] = useState('')
  const [tipoMsg, setTipoMsg] = useState<'sucesso' | 'erro' | ''>('')
  const [touched, setTouched] = useState(false)

  const { setDirty } = useDirtyForm()

  useEffect(() => {
    setTela(initialScreen || '')
  }, [initialScreen])

  const toggleCrud = (acao: CrudAction) => {
    setTouched(true)
    setCrud((prev) =>
      prev.includes(acao) ? prev.filter((c) => c !== acao) : [...prev, acao]
    )
    setDirty(true)
  }

  const formValido = tela.trim() !== '' && crud.length > 0

  const salvar = async () => {
    setTouched(true)
    if (!formValido) return
    try {
      await cadastrarConfig({ tela: tela.trim(), crud })
      setMensagem('Configuração salva com sucesso.')
      setTipoMsg('sucesso')
      setTela('')
      setCrud([])
      setTouched(false)
      setDirty(false)
    } catch (e: any) {
      setMensagem(e?.message || 'Erro ao salvar configuração.')
      setTipoMsg('erro')
    }
  }

  return (
    <div className="logs-config-container">
      <h2>Configuração de Logs</h2>
      <div className="filtros">
        <input
          type="text"
          placeholder="Tela"
          value={tela}
          onChange={(e) => {
            setTela(e.target.value)
            setTouched(true)
            setDirty(true)
          }}
        />
        {CRUD_OPTIONS.map((c) => (
          <label key={c}>
            <input
              type="checkbox"
              checked={crud.includes(c)}
              onChange={() => toggleCrud(c)}
            />
            {c}
          </label>
        ))}
        <button className="button" disabled={!formValido} onClick={salvar}>
          Salvar alterações
        </button>
      </div>
      {!formValido && touched && (
        <div className="alerta erro">
          Preencha a tela e selecione pelo menos uma ação.
        </div>
      )}
      {mensagem && <div className={`alerta ${tipoMsg}`}>{mensagem}</div>}
    </div>
  )
}

export default LogsConfig
