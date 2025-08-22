import { describe, it, expect, beforeEach } from 'vitest'
import { loadThemeFromStorage, saveTheme, saveMode, applyTheme } from './utils'

describe('utils de tema', () => {
  beforeEach(() => {
    localStorage.clear()
    const body = document.body
    body.removeAttribute('data-theme')
    body.removeAttribute('data-mode')
  })

  it('carrega padrão quando storage vazio', () => {
    const { theme, mode } = loadThemeFromStorage()
    const body = document.body
    expect(theme).toBe('roxo')
    expect(mode).toBe('light')
    expect(body.getAttribute('data-theme')).toBe('roxo')
    expect(body.getAttribute('data-mode')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('roxo')
    expect(localStorage.getItem('mode')).toBe('light')
  })

  it('salva, aplica e carrega tema e modo', () => {
    saveTheme('vermelho')
    saveMode('dark')
    applyTheme('vermelho', 'dark')
    const { theme, mode } = loadThemeFromStorage()
    const body = document.body
    expect(theme).toBe('vermelho')
    expect(mode).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('vermelho')
    expect(localStorage.getItem('mode')).toBe('dark')
    expect(body.getAttribute('data-theme')).toBe('vermelho')
    expect(body.getAttribute('data-mode')).toBe('dark')
  })

  it('idempotência de applyTheme', () => {
    expect(() => {
      for (let i = 0; i < 5; i++) {
        applyTheme('ciano', 'dark')
      }
    }).not.toThrow()
    const body = document.body
    expect(body.getAttribute('data-theme')).toBe('ciano')
    expect(body.getAttribute('data-mode')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('ciano')
    expect(localStorage.getItem('mode')).toBe('dark')
  })
})
