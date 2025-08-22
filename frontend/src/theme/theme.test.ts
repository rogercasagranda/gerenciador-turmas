import { describe, it, expect, beforeEach } from 'vitest';
import { initTheme, getCurrentTheme, setCurrentTheme, listThemes, getCurrentMode, setCurrentMode } from './index';
import '../styles/theme.css';

describe('theme registry', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-mode');
    document.head.innerHTML = '<style>:root[data-theme="roxo"]{--color-primary:#6D28D9;} :root[data-theme="azul"]{--color-primary:#3B82F6;} :root[data-theme="verde"]{--color-primary:#10B981;}</style>';
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
});
