import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AnoLetivoPage from './AnoLetivo'

beforeEach(() => {
  global.fetch = vi.fn((url: RequestInfo, opts?: RequestInit) => {
    if (typeof url === 'string' && url.endsWith('/ano-letivo')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 1, ano: 2025, ativo: true }]) } as Response)
    }
    if (typeof url === 'string' && url.endsWith('/ano-letivo/1/periodos')) {
      if (opts && opts.method === 'POST') {
        return Promise.resolve({ ok: false, status: 422, json: () => Promise.resolve({}) } as Response)
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response)
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
  }) as any
})

afterEach(() => {
  vi.resetAllMocks()
})

test('form de período impede sobreposição', async () => {
  render(<AnoLetivoPage />)
  const editar = await screen.findByRole('button', { name: 'Editar' })
  fireEvent.click(editar)
  const inicio = await screen.findByLabelText('Data início')
  const fim = await screen.findByLabelText('Data fim')
  fireEvent.change(inicio, { target: { value: '2025-01-01' } })
  fireEvent.change(fim, { target: { value: '2025-02-01' } })
  fireEvent.click(screen.getByRole('button', { name: /Salvar período/ }))
  const erro = await screen.findByText(/sobrepostos/)
  expect(erro).toBeInTheDocument()
})
