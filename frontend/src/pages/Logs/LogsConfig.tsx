import React, { useEffect, useState } from 'react'
import useDirtyForm from '@/hooks/useDirtyForm'
import { CrudAction, listScreens, saveLogConfig, screenLabel } from '@/services/logs'
import '../../styles/Logs.css'
import '../../styles/Forms.css'

const CRUD_OPTIONS: CrudAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE']

const LogsConfig: React.FC = () => {
  const [tela, setTela] = useState('')
  const [crud, setCrud] = useState<CrudAction[]>([])
  const [telas, setTelas] = useState<string[]>([])
  const { isDirty, setDirty } = useDirtyForm()

  useEffect(() => {
    listScreens().then(setTelas).catch(() => setTelas([]))
  }, [])

  const toggleCrud = (item: CrudAction) => {
    setCrud((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    )
    setDirty(true)
  }

  const onSave = async () => {
    try {
      await saveLogConfig({ tela, crud })
      alert('Configuração salva com sucesso')
      setDirty(false)
    } catch {
      alert('Erro ao salvar configuração')
    }
  }

  return (
    <div className="logs-config-container">
      <h2>Configuração de Logs</h2>
      <form
        className="logs-form"
        onSubmit={(e) => {
          e.preventDefault()
          onSave()
        }}
      >
        <div className="logs-field">
          <label htmlFor="tela">Tela</label>
          <input
            id="tela"
            className="logs-input"
            list="telas-list"
            value={tela}
            onChange={(e) => {
              setTela(e.target.value)
              setDirty(true)
            }}
            placeholder="Selecione a tela"
          />
          <datalist id="telas-list">
            {telas.map((t) => (
              <option key={t} value={t} label={screenLabel(t)} />
            ))}
          </datalist>
        </div>

        <div className="logs-field">
          <span>CRUD</span>
          <div className="crud-options">
            {CRUD_OPTIONS.map((c) => (
              <label key={c} className="crud-option">
                <input
                  type="checkbox"
                  checked={crud.includes(c)}
                  onChange={() => toggleCrud(c)}
                />
                {c}
              </label>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="save-button"
            disabled={!isDirty || !tela || crud.length === 0}
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  )
}

export default LogsConfig
