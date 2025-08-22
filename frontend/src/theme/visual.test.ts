import { describe, it, expect } from 'vitest'
import { applyTheme } from './utils'
import '../styles/theme.css'

// simple visual check that tokens propagate to elements

describe('visual tokens', () => {
  it('applies theme colors to components', () => {
    document.body.innerHTML = `<nav class="navbar"></nav><button class="btn btn-primary"></button><div class="card"></div>`
    applyTheme('azul', 'light')
    const primary = getComputedStyle(document.body).getPropertyValue('--color-primary').trim()
    const btn = getComputedStyle(document.querySelector('.btn-primary') as Element).backgroundColor
    const card = getComputedStyle(document.querySelector('.card') as Element).backgroundColor
    expect(primary).not.toBe('')
    expect(btn).not.toBe('')
    expect(card).not.toBe('')
  })
})
