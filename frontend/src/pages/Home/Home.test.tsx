import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from './Home'

function mockPerfil(perfil: string) {
  global.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ tipo_perfil: perfil, is_master: perfil === 'master' })
  }) as any)
}

afterEach(() => {
  vi.resetAllMocks()
})

test('menu de feriados visível para diretor', async () => {
  mockPerfil('diretor')
  localStorage.setItem('auth_token', 'x')
  render(
    <MemoryRouter initialEntries={['/home']}>
      <Home />
    </MemoryRouter>
  )
  await waitFor(() => expect(screen.getByText('Feriados')).toBeInTheDocument())
})

test('rota de feriados bloqueada para professor', async () => {
  mockPerfil('professor')
  localStorage.setItem('auth_token', 'x')
  render(
    <MemoryRouter initialEntries={['/cadastro/feriados']}>
      <Home />
    </MemoryRouter>
  )
  await waitFor(() => expect(screen.getByText(/Bem-vindo/)).toBeInTheDocument())
  expect(screen.queryByText('Cadastro de Feriados')).not.toBeInTheDocument()
})
