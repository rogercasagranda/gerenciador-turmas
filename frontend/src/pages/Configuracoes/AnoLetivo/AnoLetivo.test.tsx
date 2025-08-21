import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import App from '../../../App'
import AnoLetivoPage from './AnoLetivo'

function mockFetch(map: Record<string, (opts?: RequestInit) => any>) {
  global.fetch = vi.fn((input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const chave = Object.keys(map).sort((a, b) => b.length - a.length).find(k => url.includes(k))
    if (chave) return Promise.resolve(map[chave](init))
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
  }) as any
}

afterEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

// RBAC
test('menu e rota protegidos por role', async () => {
  localStorage.setItem('auth_token', 'x')
  mockFetch({ '/usuarios/me': () => ({ ok: true, json: () => Promise.resolve({ tipo_perfil: 'professor' }) }) })

  render(
    <MemoryRouter initialEntries={['/cadastro/ano-letivo']}>
      <App />
    </MemoryRouter>
  )

  expect(await screen.findByText('Bem-vindo ao Portal do Professor')).toBeInTheDocument()
  expect(screen.queryByText('Cadastro')).not.toBeInTheDocument()
})

// validações
test('impede submit com campos vazios ou datas inválidas', async () => {
  mockFetch({ '/ano-letivo': () => ({ ok: true, json: () => Promise.resolve([]) }) })
  render(<AnoLetivoPage />)
  fireEvent.click(screen.getByRole('button', { name: '+ Novo Ano Letivo' }))
  const salvar = await screen.findByRole('button', { name: 'Salvar' })
  expect(salvar).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Ano letivo'), { target: { value: 'Ano' } })
  fireEvent.change(screen.getByLabelText('Início'), { target: { value: '2024-02-01' } })
  fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2024-01-01' } })
  expect(salvar).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2024-12-31' } })
  await waitFor(() => expect(salvar).not.toBeDisabled())
})

// mensagens de erro
test.skip('exibe mensagens de erro 409/422/403', async () => {
  render(<AnoLetivoPage />)
  fireEvent.click(screen.getByRole('button', { name: '+ Novo Ano Letivo' }))
  const desc = await screen.findByLabelText('Ano letivo')
  const inicio = screen.getByLabelText('Início')
  const fim = screen.getByLabelText('Fim')
  const salvar = screen.getByRole('button', { name: 'Salvar' })

  const tentar = async (status: number, regex: RegExp) => {
    mockFetch({
      '/ano-letivo': (init) => {
        if (!init || init.method === 'GET') return { ok: true, json: () => Promise.resolve([]) }
        return { ok: false, status, json: () => Promise.resolve({}) }
      },
    })
    fireEvent.change(desc, { target: { value: 'Teste' } })
    fireEvent.change(inicio, { target: { value: '2024-01-01' } })
    fireEvent.change(fim, { target: { value: '2024-12-31' } })
    await waitFor(() => expect(salvar).not.toBeDisabled())
    fireEvent.click(salvar)
    expect(await screen.findByText(regex)).toBeInTheDocument()
  }

  await tentar(409, /duplicada/)
  await tentar(422, /Datas inválidas/)
  await tentar(403, /Sem permissão/)
})

