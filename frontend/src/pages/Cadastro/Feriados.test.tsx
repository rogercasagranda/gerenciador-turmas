import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Feriados from './Feriados'

// Mock fetch para anos letivos e feriados
beforeEach(() => {
  // Default mocks
  global.fetch = vi.fn((url: RequestInfo) => {
    if (typeof url === 'string' && url.endsWith('/ano-letivo')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: 1, ano: 2024 },
        ]),
      } as Response)
    }
    if (typeof url === 'string' && url.includes('/feriados/nacionais')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    }
    if (typeof url === 'string' && url.includes('/feriados?')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    }
    if (typeof url === 'string' && url.includes('/feriados/importar-nacionais')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    }
    if (typeof url === 'string' && url.includes('/feriados')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
  })
})

afterEach(() => {
  vi.resetAllMocks()
})

test('botão importar desabilitado sem ano selecionado', async () => {
  render(<Feriados />)
  const btn = await screen.findByRole('button', { name: /Importar todos/i })
  expect(btn).toBeDisabled()
})

