export type ThemeKey = 'default'|'roxo'|'vermelho'|'azul'|'verde'|'laranja'|'cinza'|'rosa'|'ciano'
export type ThemeName = ThemeKey
export type ModeKey  = 'light'|'dark'

export const THEME_OPTIONS: ThemeName[] = ['roxo','vermelho','azul','verde','laranja','cinza','rosa','ciano']

export function saveTheme(theme: ThemeName) {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('theme', theme) } catch {}
  }
}

export function saveMode(mode: ModeKey) {
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('mode', mode) } catch {}
  }
}

export function applyTheme(theme: ThemeName, mode: ModeKey = 'light') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-mode', mode)
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('theme', theme)
      localStorage.setItem('mode', mode)
    } catch {}
  }
  console.info('[theme] apply:', theme, mode)
}

export function loadThemeFromStorage(): { theme: ThemeName; mode: ModeKey } {
  let theme: ThemeName = 'default'
  let mode: ModeKey = 'light'
  if (typeof window !== 'undefined') {
    try {
      theme = (localStorage.getItem('theme') as ThemeName) || 'default'
      mode = (localStorage.getItem('mode') as ModeKey) || 'light'
    } catch {}
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-mode', mode)
  }
  console.info('[theme] load:', theme, mode)
  return { theme, mode }
}
