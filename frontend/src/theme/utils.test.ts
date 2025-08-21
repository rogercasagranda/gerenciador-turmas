import { describe, it, expect, beforeEach } from 'vitest'
import { loadThemeFromStorage, saveTheme, saveMode, applyTheme } from './utils'

describe('utils de tema', () => {
  beforeEach(() => {
    localStorage.clear()
    const root = document.documentElement
    root.removeAttribute('data-theme')
    root.removeAttribute('data-mode')
  })

  it('carrega padrão quando storage vazio', () => {
    const { theme, mode } = loadThemeFromStorage()
    const root = document.documentElement
    expect(theme).toBe('roxo')
    expect(mode).toBe('light')
    expect(root.getAttribute('data-theme')).toBe('roxo')
    expect(root.getAttribute('data-mode')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('roxo')
    expect(localStorage.getItem('mode')).toBe('light')
  })

  it('salva e aplica tema e modo', () => {
    saveTheme('vermelho')
    saveMode('dark')
    applyTheme('vermelho', 'dark')
    const root = document.documentElement
    expect(localStorage.getItem('theme')).toBe('vermelho')
    expect(localStorage.getItem('mode')).toBe('dark')
    expect(root.getAttribute('data-theme')).toBe('vermelho')
    expect(root.getAttribute('data-mode')).toBe('dark')
  })

  it('migra chaves antigas', () => {
    localStorage.setItem('pp_theme', 'azul')
    localStorage.setItem('pp_mode', 'light')
    const { theme, mode } = loadThemeFromStorage()
    const root = document.documentElement
    expect(theme).toBe('azul')
    expect(mode).toBe('light')
    expect(localStorage.getItem('theme')).toBe('azul')
    expect(localStorage.getItem('mode')).toBe('light')
    expect(localStorage.getItem('pp_theme')).toBeNull()
    expect(localStorage.getItem('pp_mode')).toBeNull()
    expect(root.getAttribute('data-theme')).toBe('azul')
    expect(root.getAttribute('data-mode')).toBe('light')
  })

  it('idempotência de applyTheme', () => {
    expect(() => {
      for (let i = 0; i < 5; i++) {
        applyTheme('ciano', 'dark')
      }
    }).not.toThrow()
    const root = document.documentElement
    expect(root.getAttribute('data-theme')).toBe('ciano')
    expect(root.getAttribute('data-mode')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('ciano')
    expect(localStorage.getItem('mode')).toBe('dark')
  })
})
