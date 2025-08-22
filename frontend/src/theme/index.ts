export const ThemeRegistry = {
  ROXO: 'roxo',
  VERMELHO: 'vermelho',
  AZUL: 'azul',
  VERDE: 'verde',
  LARANJA: 'laranja',
  CINZA: 'cinza',
  ROSA: 'rosa',
  CIANO: 'ciano'
} as const;

export type ThemeSlug = (typeof ThemeRegistry)[keyof typeof ThemeRegistry];
export type Mode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'pp.theme';
const MODE_STORAGE_KEY = 'pp.mode';

let currentTheme: ThemeSlug = ThemeRegistry.ROXO;
let currentMode: Mode = 'light';

export function listThemes(): ThemeSlug[] {
  return Object.values(ThemeRegistry);
}

export function getCurrentTheme(): ThemeSlug {
  return currentTheme;
}

export function getCurrentMode(): Mode {
  return currentMode;
}

export function setCurrentTheme(slug: ThemeSlug): void {
  if (!listThemes().includes(slug)) {
    throw new Error(`Tema desconhecido: ${slug}`);
  }
  currentTheme = slug;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', slug);
    const evt = new CustomEvent('theme:changed', { detail: slug });
    document.documentElement.dispatchEvent(evt);
  }
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(THEME_STORAGE_KEY, slug); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('theme:changed', { detail: slug }));
  }
}

export function setCurrentMode(mode: Mode): void {
  currentMode = mode;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-mode', mode);
    const evt = new CustomEvent('mode:changed', { detail: mode });
    document.documentElement.dispatchEvent(evt);
  }
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(MODE_STORAGE_KEY, mode); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('mode:changed', { detail: mode }));
  }
}

export function initTheme(): void {
  if (typeof window !== 'undefined') {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeSlug | null;
      const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY) as Mode | null;
      if (savedTheme && listThemes().includes(savedTheme)) {
        currentTheme = savedTheme;
      } else {
        window.localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
      }
      if (savedMode) currentMode = savedMode; else window.localStorage.setItem(MODE_STORAGE_KEY, currentMode);
    } catch { /* ignore */ }
  }
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-mode', currentMode);
  }
}
