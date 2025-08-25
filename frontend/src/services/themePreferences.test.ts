import { describe, it, expect, beforeEach, vi } from 'vitest'
import { syncThemePreference } from './themePreferences'
import { getCurrentTheme, getCurrentMode } from '../utils/theme'

vi.stubGlobal('fetch', () =>
  Promise.resolve(
    new Response(
      JSON.stringify({ themeName: 'azul', themeMode: 'dark' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  )
)

describe('theme preference sync', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-mode')
  })

  it('applies preferences from backend', async () => {
    await syncThemePreference()
    expect(getCurrentTheme()).toBe('azul')
    expect(getCurrentMode()).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('azul')
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark')
    expect(localStorage.getItem('pp.theme')).toBe('azul')
  })
})
