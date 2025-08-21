export type ThemeKey = 'default'|'roxo'|'vermelho'|'azul'|'verde'|'laranja'|'cinza'|'rosa'|'ciano'
export type ThemeName = ThemeKey
export type ModeKey  = 'light'|'dark'

export const THEME_OPTIONS: ThemeName[] = ['roxo','vermelho','azul','verde','laranja','cinza','rosa','ciano']

export function saveTheme(theme: ThemeName) {
  localStorage.setItem('theme', theme)
}

export function saveMode(mode: ModeKey) {
  localStorage.setItem('mode', mode)
}

export function applyTheme(theme: ThemeName, mode: ModeKey = 'light') {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.setAttribute('data-mode', mode)
  localStorage.setItem('theme', theme)
  localStorage.setItem('mode', mode)
}

export function loadThemeFromStorage(): { theme: ThemeName; mode: ModeKey } {
  const theme = (localStorage.getItem('theme') as ThemeName) || 'default'
  const mode = (localStorage.getItem('mode') as ModeKey) || 'light'
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.setAttribute('data-mode', mode)
  return { theme, mode }
}
