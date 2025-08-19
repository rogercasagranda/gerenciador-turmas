import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import Feriados from './Feriados'

// Utilitário para mock de fetch
function mockFetch(map: Record<string, (opts?: RequestInit) => any>) {
  global.fetch = vi.fn((input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    // Busca a chave mais específica (maior comprimento) que combina com a URL
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

// --- Teste de RBAC ---
test('menu e rota protegidos por role', async () => {
  // Token presente para evitar redirecionamento inicial
  localStorage.setItem('auth_token', 'x')

  // Resposta para /usuarios/me indicando perfil não autorizado
  mockFetch({
    '/usuarios/me': () => ({ ok: true, json: () => Promise.resolve({ tipo_perfil: 'professor' }) }),
  })

  render(
    <MemoryRouter initialEntries={['/cadastro/feriados']}>
      <App />
    </MemoryRouter>
  )

  // Deve redirecionar para /home e exibir mensagem de boas-vindas
  expect(await screen.findByText('Bem-vindo ao Portal do Professor')).toBeInTheDocument()
  expect(screen.queryByText('Cadastro')).not.toBeInTheDocument()
})

// --- Teste de validação e erros do backend ---
test('impede salvar fora do período e mostra erro do backend', async () => {
  localStorage.setItem('auth_token', 'x')

  mockFetch({
    '/ano-letivo': () => ({ ok: true, json: () => Promise.resolve([{ id: 1, ano: 2024 }]) }),
    '/ano-letivo/1/periodos': () => ({ ok: true, json: () => Promise.resolve([{ id: 1, data_inicio: '2024-01-01T00:00:00', data_fim: '2024-12-31T00:00:00' }]) }),
    '/feriados?anoLetivoId=1': () => ({ ok: true, json: () => Promise.resolve([]) }),
    '/feriados': (init) => {
      if (init?.method === 'POST') return { ok: false, status: 409, json: () => Promise.resolve({}) }
      return { ok: true, json: () => Promise.resolve({}) }
    },
  })

  render(<Feriados />)

  // Seleciona ano letivo
  fireEvent.change(await screen.findByLabelText('Ano letivo'), { target: { value: '1' } })
  await screen.findByText(/Períodos:/)

  // Abre formulário
  fireEvent.click(screen.getByRole('button', { name: 'Novo Feriado' }))

  // Data fora do período
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2025-01-01' } })
  fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Teste' } })
  const salvar = screen.getByRole('button', { name: 'Cadastrar' })
  expect(salvar).toBeDisabled()

  // Data válida e backend retornando 409
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2024-06-01' } })
  await waitFor(() => expect(salvar).not.toBeDisabled())
  fireEvent.click(salvar)
  expect(await screen.findByText(/já cadastrado/)).toBeInTheDocument()
})

// --- Teste de importação deduplicada ---
test('importar nacionais deduplica feriados', async () => {
  localStorage.setItem('auth_token', 'x')
  let chamadas = 0
  mockFetch({
    '/ano-letivo': () => ({ ok: true, json: () => Promise.resolve([{ id: 1, ano: 2024 }]) }),
    '/ano-letivo/1/periodos': () => ({ ok: true, json: () => Promise.resolve([{ id: 1, data_inicio: '2024-01-01T00:00:00', data_fim: '2024-12-31T00:00:00' }]) }),
    '/feriados?anoLetivoId=1': () => {
      chamadas += 1
      if (chamadas === 1) return { ok: true, json: () => Promise.resolve([]) }
      return {
        ok: true,
        json: () => Promise.resolve([
          { id: 1, data: '2024-01-01', descricao: 'A', origem: 'NACIONAL' },
          { id: 1, data: '2024-01-01', descricao: 'A', origem: 'NACIONAL' },
        ]),
      }
    },
    '/feriados/importar-nacionais': () => ({ ok: true, json: () => Promise.resolve({}) }),
  })

  render(<Feriados />)

  // Seleciona ano letivo
  fireEvent.change(await screen.findByLabelText('Ano letivo'), { target: { value: '1' } })

  // Aguarda carregamento dos períodos antes de abrir modal
  await screen.findByText(/Períodos:/)
  fireEvent.click(screen.getByRole('button', { name: 'Importar Nacionais' }))
  fireEvent.click(screen.getByRole('button', { name: 'Importar' }))

  // Deve renderizar apenas uma linha para o feriado "A"
  await waitFor(() => expect(screen.getAllByText('A').length).toBe(1))
})
