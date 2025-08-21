export type ThemeKey = 'indigo'|'purple'|'blue'|'green'|'orange'|'red'|'gray'|'pink'|'teal'|'yellow'
export type ModeKey  = 'light'|'dark'

const THEME_KEY = 'pp_theme'
const MODE_KEY  = 'pp_mode'

export function applyTheme(theme: ThemeKey, mode: ModeKey) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-mode', mode)
  localStorage.setItem(THEME_KEY, theme)
  localStorage.setItem(MODE_KEY, mode)
}

export function loadThemeFromStorage(): { theme: ThemeKey; mode: ModeKey } {
  const theme = (localStorage.getItem(THEME_KEY) as ThemeKey) || 'indigo'
  const mode  = (localStorage.getItem(MODE_KEY)  as ModeKey)  || 'light'
  applyTheme(theme, mode)
  return { theme, mode }
}
