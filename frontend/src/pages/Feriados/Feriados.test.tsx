import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import Feriados from './Feriados'

function mockFetch(map: Record<string, (opts?: RequestInit) => any>) {
  global.fetch = vi.fn((input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const chave = Object.keys(map).sort((a, b) => b.length - a.length).find(k => url.includes(k))
    if (chave) return Promise.resolve(map[chave](init))
    return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: () => Promise.resolve({}), text: () => Promise.resolve('{}') } as any)
  }) as any
}

afterEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

// RBAC
it('menu e rota protegidos por role', async () => {
  localStorage.setItem('auth_token', 'x')
  mockFetch({ '/usuarios/me': () => ({ ok: true, status: 200, headers: { get: () => 'application/json' }, json: () => Promise.resolve({ tipo_perfil: 'professor' }), text: () => Promise.resolve('{"tipo_perfil":"professor"}') }) })
  render(
    <MemoryRouter initialEntries={['/cadastro/feriados']}>
      <App />
    </MemoryRouter>
  )
  expect(await screen.findByText('Bem-vindo ao Portal do Professor')).toBeInTheDocument()
  expect(screen.queryByText('Cadastro')).not.toBeInTheDocument()
})

// Novo feriado com erro 409
it.skip('novo feriado mostra erro do backend', async () => {
  localStorage.setItem('auth_token', 'x')
  mockFetch({
    '/ano-letivo': () => ({ ok: true, json: () => Promise.resolve([{ id: 1, descricao: '2024', data_inicio: '2024-01-01', data_fim: '2024-12-31' }]) }),
    '/feriados?anoLetivoId=1': () => ({ ok: true, json: () => Promise.resolve([]) }),
    '/feriados': () => ({ ok: false, status: 409, json: () => Promise.resolve({}) }),
  })
  render(<Feriados />)
  expect(await screen.findByText('Nenhum feriado cadastrado.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /\+ Novo Feriado/ }))
  fireEvent.change(screen.getByLabelText('Ano letivo'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Dia do feriado'), { target: { value: '2024-01-02' } })
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Teste' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText(/já cadastrado/)).toBeInTheDocument()
})
