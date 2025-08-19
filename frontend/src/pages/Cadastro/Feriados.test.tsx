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
          { id: 1, ano: 2024, data_inicio: '2024-01-01', data_fim: '2024-12-31' },
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

test('valida data fora do ano letivo', async () => {
  render(<Feriados />)
  const select = await screen.findByLabelText(/Ano letivo/i)
  fireEvent.change(select, { target: { value: '1' } })
  // muda para aba da escola para exibir o formulário
  fireEvent.click(screen.getByText('Feriados da Escola'))
  const data = await screen.findByLabelText('Data')
  const desc = screen.getByLabelText('Descrição')
  fireEvent.change(data, { target: { value: '2025-01-01' } })
  fireEvent.change(desc, { target: { value: 'Teste' } })
  const salvar = screen.getByRole('button', { name: /Salvar/i })
  fireEvent.click(salvar)
  expect(await screen.findByText(/fora do ano letivo/i)).toBeInTheDocument()
})
