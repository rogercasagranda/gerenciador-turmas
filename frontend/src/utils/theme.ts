export type ThemeName = 'preto' | 'cinza' | 'roxo' | 'azul' | 'vermelho' | 'rosa'

const THEME_VARS: Record<ThemeName, { dark: string; mid: string; light: string }> = {
  preto: { dark: '#000000', mid: '#222222', light: '#e5e5e5' },
  cinza: { dark: '#3f3f3f', mid: '#6b7280', light: '#f3f4f6' },
  roxo: { dark: '#3d0070', mid: '#53139c', light: '#efe6ff' },
  azul: { dark: '#003f7f', mid: '#0059b3', light: '#e6f0ff' },
  vermelho: { dark: '#7f0000', mid: '#b30000', light: '#ffe6e6' },
  rosa: { dark: '#7f003f', mid: '#b30059', light: '#ffe6f0' },
}

const STORAGE_KEY = 'app_theme'

function getStorageKey(): string {
  const userId = localStorage.getItem('user_id')
  return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY
}

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement
  const colors = THEME_VARS[theme]
  root.style.setProperty('--pp-purple-900', colors.dark)
  root.style.setProperty('--pp-purple-700', colors.mid)
  root.style.setProperty('--pp-purple-100', colors.light)
  localStorage.setItem(getStorageKey(), theme)
}

export function loadTheme(): ThemeName {
  const saved = (localStorage.getItem(getStorageKey()) as ThemeName) || 'roxo'
  if (saved in THEME_VARS) {
    const colors = THEME_VARS[saved]
    const root = document.documentElement
    root.style.setProperty('--pp-purple-900', colors.dark)
    root.style.setProperty('--pp-purple-700', colors.mid)
    root.style.setProperty('--pp-purple-100', colors.light)
    return saved
  }
  return 'roxo'
}

export const THEME_OPTIONS: ThemeName[] = ['preto', 'cinza', 'roxo', 'azul', 'vermelho', 'rosa']
