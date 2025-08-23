import { describe, it, expect, beforeEach } from 'vitest';
import { initTheme, getCurrentTheme, setCurrentTheme, listThemes, getCurrentMode, setCurrentMode } from './theme';
import '../styles/theme.css';

describe('theme registry', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-mode');
    document.head.innerHTML = '<style>:root[data-theme="roxo"]{--color-primary:#6D28D9;--color-primary-contrast:#ffffff;} :root[data-theme="azul"]{--color-primary:#3B82F6;--color-primary-contrast:#ffffff;} :root[data-theme="verde"]{--color-primary:#10B981;--color-primary-contrast:#ffffff;}</style>';
    initTheme();
  });

  it('loads default theme from storage', () => {
    expect(getCurrentTheme()).toBe(listThemes()[0]);
    expect(document.documentElement.getAttribute('data-theme')).toBe(listThemes()[0]);
    expect(localStorage.getItem('pp.theme')).toBe(listThemes()[0]);
    expect(getCurrentMode()).toBe('light');
  });

  it('sets and persists theme and mode', () => {
    setCurrentTheme('verde');
    setCurrentMode('dark');
    expect(getCurrentTheme()).toBe('verde');
    expect(document.documentElement.getAttribute('data-theme')).toBe('verde');
    expect(localStorage.getItem('pp.theme')).toBe('verde');
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
  });

  it('switches themes updates css variables', () => {
    const getPrimary = () => getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
    const first = getPrimary();
    setCurrentTheme('azul');
    const second = getPrimary();
    setCurrentTheme('verde');
    const third = getPrimary();
    expect(first).not.toBe(second);
    expect(second).not.toBe(third);
  });

  it('ensures contrast between primary and on-primary across modes', () => {
    const parseHex = (hex: string) => {
      const h = hex.replace('#', '');
      return [0, 1, 2].map(i => parseInt(h.substring(i * 2, i * 2 + 2), 16) / 255);
    };
    const luminance = ([r, g, b]: number[]) => {
      const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    };
    const contrast = (c1: string, c2: string) => {
      const L1 = luminance(parseHex(c1.trim()));
      const L2 = luminance(parseHex(c2.trim()));
      const [bright, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
      return (bright + 0.05) / (dark + 0.05);
    };

    const getColors = () => {
      const style = getComputedStyle(document.documentElement);
      return [style.getPropertyValue('--color-primary'), style.getPropertyValue('--color-primary-contrast')];
    };

    setCurrentTheme('roxo');
    setCurrentMode('light');
    let [p, pc] = getColors();
    expect(contrast(p, pc)).toBeGreaterThanOrEqual(4.5);
    setCurrentMode('dark');
    [p, pc] = getColors();
    expect(contrast(p, pc)).toBeGreaterThanOrEqual(4.5);
  });
});
