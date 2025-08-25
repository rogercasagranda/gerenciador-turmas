import { apiFetch } from './api'
import { setCurrentTheme, setCurrentMode, ThemeSlug, Mode } from '../utils/theme'

export interface ThemePreference {
  themeName: ThemeSlug
  themeMode: Mode
}

export async function getThemePreference(): Promise<ThemePreference> {
  return await apiFetch('/me/preferences/theme', { method: 'GET' })
}

export async function syncThemePreference(): Promise<void> {
  try {
    const prefs = await getThemePreference()
    if (prefs?.themeName) setCurrentTheme(prefs.themeName)
    if (prefs?.themeMode) setCurrentMode(prefs.themeMode)
  } catch {
    // ignore errors to avoid blocking login
  }
}
