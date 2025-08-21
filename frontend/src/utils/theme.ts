export type ThemeKey = 'indigo'|'purple'|'blue'|'green'|'orange'|'red'|'gray'|'pink'|'teal'|'yellow'
export type ThemeName = ThemeKey
export type ModeKey  = 'light'|'dark'

export const THEME_OPTIONS: ThemeName[] = ['indigo','purple','blue','green','orange','red','gray','pink','teal','yellow']

const THEME_KEY = 'pp_theme'
const MODE_KEY  = 'pp_mode'

export function applyTheme(theme: ThemeName, mode: ModeKey = 'light') {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-mode', mode)
  // Ajusta variáveis legadas utilizadas pelo layout antigo
  root.style.setProperty('--pp-purple-700', 'var(--color-primary)')
  root.style.setProperty('--pp-purple-900', 'color-mix(in srgb, var(--color-primary) 80%, black)')
  root.style.setProperty('--pp-purple-100', 'color-mix(in srgb, var(--color-primary) 20%, white)')
  root.style.setProperty('--pp-purple-50', 'color-mix(in srgb, var(--color-primary) 10%, white)')
  root.style.setProperty('--pp-surface', 'var(--surface)')
  root.style.setProperty('--pp-text', 'var(--text)')
  root.style.setProperty('--pp-border', 'var(--border)')
  root.style.setProperty('--pp-muted', 'color-mix(in srgb, var(--text) 60%, var(--bg))')
  root.style.setProperty('--pp-danger', '#e53e3e')
  root.style.setProperty('--pp-shadow', 'rgba(0,0,0,0.1)')
  localStorage.setItem(THEME_KEY, theme)
  localStorage.setItem(MODE_KEY, mode)
}

export function loadThemeFromStorage(): { theme: ThemeName; mode: ModeKey } {
  const theme = (localStorage.getItem(THEME_KEY) as ThemeName) || 'indigo'
  const mode  = (localStorage.getItem(MODE_KEY)  as ModeKey)  || 'light'
  applyTheme(theme, mode)
  return { theme, mode }
}

export function loadTheme(): ThemeName {
  return loadThemeFromStorage().theme
}
