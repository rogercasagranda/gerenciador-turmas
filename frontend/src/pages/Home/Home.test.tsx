import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from './Home'
import RouteGuard from '@/routes/RouteGuard'

function mockPerfil(perfil: string, perms?: Record<string, Record<string, boolean>>) {
  const effective =
    perms ??
    (perfil === 'diretor'
      ? {
          '/cadastro/feriados': { view: true },
          '/cadastro/ano-letivo': { view: true }
        }
      : {})
  global.fetch = vi.fn((url: string) => {
    const body = url.includes('/permissions/effective')
      ? effective
      : { tipo_perfil: perfil, is_master: perfil === 'master' }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body))
    }) as any
  })
  localStorage.setItem('permissions.effective', JSON.stringify(effective))
}

afterEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

test.skip('menu de feriados visível para diretor', async () => {
  mockPerfil('diretor')
  localStorage.setItem('auth_token', 'x')
  render(
    <MemoryRouter initialEntries={['/home']}>
      <Home />
    </MemoryRouter>
  )
  await waitFor(() => expect(screen.getByText('Feriados')).toBeInTheDocument())
})

test.skip('menu de ano letivo visível para diretor', async () => {
  mockPerfil('diretor')
  localStorage.setItem('auth_token', 'x')
  render(
    <MemoryRouter initialEntries={['/home']}>
      <Home />
    </MemoryRouter>
  )
  await waitFor(() => expect(screen.getByText('Ano Letivo')).toBeInTheDocument())
})

test('rota de feriados bloqueada para professor', async () => {
  mockPerfil('professor')
  localStorage.setItem('auth_token', 'x')
  render(
    <MemoryRouter initialEntries={['/cadastro/feriados']}>
      <Routes>
        <Route path='/cadastro/*' element={<RouteGuard><Home /></RouteGuard>} />
        <Route path='/403' element={<RouteGuard><Home /></RouteGuard>} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(screen.getByText('Bem-vindo ao Portal do Professor')).toBeInTheDocument())
  expect(screen.queryByText('Cadastro de Feriados')).not.toBeInTheDocument()
})

test('rota de ano letivo bloqueada para professor', async () => {
  mockPerfil('professor')
  localStorage.setItem('auth_token', 'x')
  render(
    <MemoryRouter initialEntries={['/cadastro/ano-letivo']}>
      <Routes>
        <Route path='/cadastro/*' element={<RouteGuard><Home /></RouteGuard>} />
        <Route path='/403' element={<RouteGuard><Home /></RouteGuard>} />
      </Routes>
    </MemoryRouter>
  )
  await waitFor(() => expect(screen.getByText('Bem-vindo ao Portal do Professor')).toBeInTheDocument())
  expect(screen.queryByText('Cadastro de Ano Letivo')).not.toBeInTheDocument()
})

test('menu oculta item quando permissão ausente', async () => {
  mockPerfil('diretor', {})
  localStorage.setItem('auth_token', 'x')
  render(
    <MemoryRouter initialEntries={['/home']}>
      <Home />
    </MemoryRouter>
  )
  await waitFor(() => expect(screen.getByText(/Bem-vindo/)).toBeInTheDocument())
  expect(screen.queryByText('Feriados')).not.toBeInTheDocument()
})
