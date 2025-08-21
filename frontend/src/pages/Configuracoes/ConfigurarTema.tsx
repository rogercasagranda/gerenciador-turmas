import React, { useEffect, useState } from 'react'
import '../../styles/ConfigTema.css'
import { applyTheme, loadThemeFromStorage, saveTheme, saveMode, THEME_OPTIONS, ThemeName, ModeKey } from '../../theme/utils'

const ConfigurarTema: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>('roxo')
  const [selectedMode, setSelectedMode] = useState<ModeKey>('light')
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const { theme, mode } = loadThemeFromStorage()
    setSelectedTheme(theme)
    setSelectedMode(mode)
  }, [])

  const handleSalvar = () => {
    saveTheme(selectedTheme)
    saveMode(selectedMode)
    applyTheme(selectedTheme, selectedMode)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <section>
      <h2>Configurar Tema</h2>
      <p>Escolha uma cor para o tema do aplicativo:</p>
      <div className="theme-grid">
        {THEME_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt}
            aria-label={opt}
            className={`theme-swatch ${opt}${selectedTheme === opt ? ' selected' : ''}`}
            onClick={() => setSelectedTheme(opt)}
          />
        ))}
      </div>

      <div className="mode-toggle">
        <label>
          <input
            type="checkbox"
            checked={selectedMode === 'dark'}
            onChange={(e) => setSelectedMode(e.target.checked ? 'dark' : 'light')}
          />
          Ativar modo escuro
        </label>
      </div>

      <div className="theme-preview" data-theme={selectedTheme} data-mode={selectedMode}>
        <div className="preview-header"></div>
        <button className="button">Botão Primário</button>
      </div>

      {showToast && <div className="toast-success">Tema alterado com sucesso</div>}

      <div className="theme-actions">
        <button className="button" onClick={handleSalvar}>Salvar alterações</button>
      </div>
    </section>
  )
}

export default ConfigurarTema
