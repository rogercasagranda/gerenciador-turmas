import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import AnoLetivoPage from './AnoLetivo'

// Utilitário simples para mockar fetch com base na URL
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

// --- RBAC ---
test('menu e rota protegidos por role', async () => {
  localStorage.setItem('auth_token', 'x')
  localStorage.setItem('authToken', 'x')
  mockFetch({ '/usuarios/me': () => ({ ok: true, json: () => Promise.resolve({ tipo_perfil: 'professor' }) }) })

  render(
    <MemoryRouter initialEntries={['/cadastro/ano-letivo']}>
      <App />
    </MemoryRouter>
  )

  expect(await screen.findByText('Bem-vindo ao Portal do Professor')).toBeInTheDocument()
  expect(screen.queryByText('Cadastro')).not.toBeInTheDocument()
})

// --- Validações do formulário ---
test('impede submit com campos vazios ou datas inválidas', async () => {
  localStorage.setItem('authToken', 'x')
  mockFetch({
    '/ano-letivo': () => ({ ok: true, json: () => Promise.resolve([]) }),
    '/usuarios/me': () => ({ ok: true, json: () => Promise.resolve({ tipo_perfil: 'master' }) }),
  })
  render(
    <MemoryRouter>
      <AnoLetivoPage />
    </MemoryRouter>
  )

  const salvar = screen.getByRole('button', { name: 'Salvar' })
  expect(salvar).toBeDisabled() // campos vazios

  fireEvent.change(screen.getByLabelText('Ano Letivo'), { target: { value: 'Ano' } })
  fireEvent.change(screen.getByLabelText('Início'), { target: { value: '2024-02-01' } })
  fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2024-01-01' } })
  expect(salvar).toBeDisabled() // inicio > fim

  fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2024-12-31' } })
  await waitFor(() => expect(salvar).not.toBeDisabled())
})

// --- Mensagens de erro do backend ---
test('exibe mensagens de erro 409/422/403', async () => {
  localStorage.setItem('authToken', 'x')
  mockFetch({
    '/ano-letivo': () => ({ ok: true, json: () => Promise.resolve([]) }),
    '/usuarios/me': () => ({ ok: true, json: () => Promise.resolve({ tipo_perfil: 'master' }) }),
  })
  render(
    <MemoryRouter>
      <AnoLetivoPage />
    </MemoryRouter>
  )

  const desc = screen.getByLabelText('Ano Letivo')
  const inicio = screen.getByLabelText('Início')
  const fim = screen.getByLabelText('Fim')
  const salvar = screen.getByRole('button', { name: 'Salvar' })

  const tentar = async (status: number, regex: RegExp) => {
    mockFetch({
      '/usuarios/me': () => ({ ok: true, json: () => Promise.resolve({ tipo_perfil: 'master' }) }),
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

