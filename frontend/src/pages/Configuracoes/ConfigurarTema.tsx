import React, { useEffect, useState } from 'react'
import '../../styles/ConfigTema.css'
import { listThemes, getCurrentTheme, setCurrentTheme, getCurrentMode, setCurrentMode, ThemeSlug, Mode } from '../../utils/theme'
import { put } from '../../services/http'

const ConfigurarTema: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeSlug>(getCurrentTheme())
  const [selectedMode, setSelectedMode] = useState<Mode>(getCurrentMode())
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    setSelectedTheme(getCurrentTheme())
    setSelectedMode(getCurrentMode())
  }, [])

  const handleSalvar = async () => {
    try {
      await put('/me/preferences/theme', { themeName: selectedTheme, themeMode: selectedMode })
    } catch {
      // ignore errors silently
    }
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <section>
      <h2>Configurar Tema</h2>
      <p>Escolha uma cor para o tema do aplicativo:</p>
      <div className="config-grid">
        {listThemes().map((opt) => (
          <button
            type="button"
            key={opt}
            aria-label={opt}
            className={`btn btn-md color-swatch${selectedTheme === opt ? ' selected' : ''}`}
            style={{ '--swatch-color': `var(--theme-${opt})` } as React.CSSProperties}
            onClick={() => { setCurrentTheme(opt); setSelectedTheme(opt); }}
          />
        ))}
      </div>

      <div className="mode-toggle">
        <label>
          <input
            type="checkbox"
            checked={selectedMode === 'dark'}
            onChange={(e) => {
              const mode = e.target.checked ? 'dark' : 'light';
              setCurrentMode(mode);
              setSelectedMode(mode);
            }}
          />
          Ativar modo escuro
        </label>
      </div>

      <div
        className="preview-box"
        data-preview-mode={selectedMode}
        style={{ '--primary': `var(--theme-${selectedTheme})`, '--on-primary': `var(--theme-${selectedTheme}-on)` } as React.CSSProperties}
      >
        <div className="preview-header"></div>
        <button className="btn btn-md btn-primary">Botão Primário</button>
      </div>

      {showToast && <div className="toast-success">Tema alterado com sucesso</div>}

      <div className="config-actions">
        <button className="btn btn-md btn-primary" onClick={handleSalvar}>Salvar alterações</button>
      </div>
    </section>
  )
}

export default ConfigurarTema
