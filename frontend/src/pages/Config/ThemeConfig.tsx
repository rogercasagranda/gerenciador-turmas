import React, { useEffect, useState } from 'react'
import '../../styles/ThemeConfig.css'
import { applyTheme, loadTheme, THEME_OPTIONS, ThemeName } from '../../utils/theme'

const ThemeConfig: React.FC = () => {
  const [selecionado, setSelecionado] = useState<ThemeName>('roxo')

  useEffect(() => {
    setSelecionado(loadTheme())
  }, [])

  const handleSelecionar = (t: ThemeName) => {
    applyTheme(t)
    setSelecionado(t)
  }

  return (
    <section>
      <h2>Configurar Tema</h2>
      <p>Escolha uma cor para o tema do aplicativo:</p>
      <div className="theme-options">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt}
            className={`theme-option${selecionado === opt ? ' active' : ''}`}
            onClick={() => handleSelecionar(opt)}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>
    </section>
  )
}

export default ThemeConfig
