import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ConsultarAcessos from './Consultar'

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/services/permissoesGrupo', () => ({
  listarGrupos: vi.fn()
}))

vi.mock('@/services/usuariosPorGrupo', () => ({
  listarUsuariosPorGrupo: vi.fn(),
  exportarUsuariosPorGrupo: vi.fn()
}))

import { listarGrupos } from '@/services/permissoesGrupo'
import { listarUsuariosPorGrupo, exportarUsuariosPorGrupo } from '@/services/usuariosPorGrupo'

const listarGruposMock = listarGrupos as any
const listarUsuariosMock = listarUsuariosPorGrupo as any
const exportarMock = exportarUsuariosPorGrupo as any

beforeEach(() => {
  listarGruposMock.mockResolvedValue([])
  listarUsuariosMock.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 })
  exportarMock.mockResolvedValue(new Blob(['x'], { type: 'text/plain' }))
  ;(window.URL.createObjectURL as any) = vi.fn(() => 'url')
  ;(window.URL.revokeObjectURL as any) = vi.fn()
  ;(HTMLAnchorElement.prototype.click as any) = vi.fn()
})

afterEach(() => {
  vi.resetAllMocks()
})

test('botões de export chamam serviço com formatos corretos', async () => {
  render(<ConsultarAcessos />)
  await waitFor(() => expect(listarUsuariosMock).toHaveBeenCalled())
  fireEvent.click(screen.getByText('CSV'))
  fireEvent.click(screen.getByText('XLSX'))
  fireEvent.click(screen.getByText('PDF'))
  expect(exportarMock.mock.calls.map((c: any) => c[1])).toEqual([
    'csv',
    'xlsx',
    'pdf'
  ])
})

