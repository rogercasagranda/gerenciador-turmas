import React, { useEffect, useState } from 'react'
import useDirtyForm from '@/hooks/useDirtyForm'
import { CrudAction, listScreens, saveLogConfig, screenLabel } from '@/services/logs'
import '../../styles/Logs.css'
import { cadastrarConfig } from '@/services/logs'

import useDirtyForm from '@/hooks/useDirtyForm'


const CRUD_OPTIONS: CrudAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE']

const LogsConfig: React.FC = () => {

  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [globalEnabled, setGlobalEnabled] = useState(true)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const [tela, setTela] = useState('')
  const [crud, setCrud] = useState<string[]>([])
  const [mensagem, setMensagem] = useState('')
  const [tipoMsg, setTipoMsg] = useState<'sucesso' | 'erro' | ''>('')
  const [touched, setTouched] = useState(false)

  const { setDirty } = useDirtyForm()

  const token =
    localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

  const carregar = () => {
    Promise.all([
      axios.get<ConfigItem[]>(`${API_BASE}/logs/config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
      axios.get<string[]>(`${API_BASE}/logs/entidades`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }),
    ])
      .then(([configRes, telasRes]) => {
        const cfgMap = new Map(
          configRes.data.map((c) => [c.entidade, c.habilitado])
        )
        const todas = Array.from(
          new Set([
            ...telasRes.data,
            ...configRes.data.map((c) => c.entidade),
          ])
        )
        const global = cfgMap.get('__all__')
        setGlobalEnabled(global ?? true)
        setConfigs(
          todas
            .filter((t) => t !== '__all__')
            .map((t) => ({ entidade: t, habilitado: cfgMap.get(t) ?? true }))
        )
      })
      .catch(() => {
        setConfigs([])
        setGlobalEnabled(true)
      })
  }

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

  const toggleCrud = (acao: string) => {
    setTouched(true)
    setCrud((prev) =>
      prev.includes(acao) ? prev.filter((c) => c !== acao) : [...prev, acao]
    )
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
      carregar()
    } catch (e: any) {
      setMensagem(e?.message || 'Erro ao salvar configuração.')
      setTipoMsg('erro')
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

              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {mensagem && <div className={`alerta ${tipoMsg}`}>{mensagem}</div>}

      <div className="filtros">
        <input
          type="text"

          placeholder="Tela"
          value={tela}
          onChange={(e) => {
            setTela(e.target.value)
            setTouched(true)

          }}
        />
        <label>
          <input
            type="checkbox"

            checked={crud.includes('CREATE')}
            onChange={() => toggleCrud('CREATE')}

          />
          CREATE
        </label>

        <label>
          <input
            type="checkbox"
            checked={crud.includes('READ')}
            onChange={() => toggleCrud('READ')}
          />
          READ
        </label>
        <label>
          <input
            type="checkbox"
            checked={crud.includes('UPDATE')}
            onChange={() => toggleCrud('UPDATE')}
          />
          UPDATE
        </label>
        <label>
          <input
            type="checkbox"
            checked={crud.includes('DELETE')}
            onChange={() => toggleCrud('DELETE')}
          />
          DELETE
        </label>
        <button disabled={!formValido} onClick={salvar}>
          Salvar alterações

        </button>
      </div>
      {!formValido && touched && (
        <div className="alerta erro">
          Preencha a tela e selecione pelo menos uma ação.
        </div>
      )}
      <div className="filtros">
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => {
            setDataInicio(e.target.value)
            setDirty(true)
          }}
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => {
            setDataFim(e.target.value)
            setDirty(true)
          }}
        />
        <button
          onClick={() => {
            excluirLogs()
            setDirty(false)
          }}
        >
          Excluir por período
        </button>
      </div>

    </div>
  )
}

export default LogsConfig
