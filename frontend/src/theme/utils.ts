export type ThemeKey = 'roxo'|'vermelho'|'azul'|'verde'|'laranja'|'cinza'|'rosa'|'ciano'
export type ThemeName = ThemeKey
export type ModeKey  = 'light'|'dark'

export const THEME_OPTIONS: ThemeName[] = ['roxo','vermelho','azul','verde','laranja','cinza','rosa','ciano']

export const THEME_COLORS: Record<ThemeName, string> = {
  roxo: '#6D28D9',
  vermelho: '#EF4444',
  azul: '#3B82F6',
  verde: '#10B981',
  laranja: '#F59E0B',
  cinza: '#6B7280',
  rosa: '#EC4899',
  ciano: '#06B6D4'
}

const THEME_KEY = 'pp.theme'
const MODE_KEY  = 'pp.mode'
const LEGACY_THEME_KEY = 'pp_theme'
const LEGACY_MODE_KEY  = 'pp_mode'

export function getStoredTheme(): ThemeName {
  let theme = localStorage.getItem(THEME_KEY) as ThemeName | null
  if (!theme) {
    const legacy = localStorage.getItem(LEGACY_THEME_KEY) as ThemeName | null
    if (legacy) {
      theme = legacy as ThemeName
      saveTheme(theme)
      try { localStorage.removeItem(LEGACY_THEME_KEY) } catch {}
    } else {
      theme = 'roxo'
    }
  }
  return theme
}

export function getStoredMode(): ModeKey {
  let mode = localStorage.getItem(MODE_KEY) as ModeKey | null
  if (!mode) {
    const legacy = localStorage.getItem(LEGACY_MODE_KEY) as ModeKey | null
    if (legacy) {
      mode = legacy as ModeKey
      saveMode(mode)
      try { localStorage.removeItem(LEGACY_MODE_KEY) } catch {}
    } else {
      mode = 'light'
    }
  }
  return mode
}

export function saveTheme(theme: ThemeName) {
  localStorage.setItem(THEME_KEY, theme)
}

export function saveMode(mode: ModeKey) {
  localStorage.setItem(MODE_KEY, mode)
}

export function applyTheme(theme: ThemeName, mode: ModeKey = 'light') {
  const root = document.documentElement
  if (root.getAttribute('data-theme') !== theme) {
    root.setAttribute('data-theme', theme)
  }
  if (root.getAttribute('data-mode') !== mode) {
    root.setAttribute('data-mode', mode)
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  const color = THEME_COLORS[theme] || THEME_COLORS.roxo
  if (meta && meta.getAttribute('content') !== color) {
    meta.setAttribute('content', color)
  }
}

export function loadThemeFromStorage(): { theme: ThemeName; mode: ModeKey } {
  const theme = getStoredTheme()
  const mode  = getStoredMode()
  applyTheme(theme, mode)
  return { theme, mode }
}
