import { lazy } from 'react'

export interface AppRoute {
  path: string
  name: string
  component: React.LazyExoticComponent<React.ComponentType<any>>
  meta: {
    area: string
    menu: boolean
    requiresAuth: boolean
    restritaProfessor?: boolean
  }
}

export const routesConfig: AppRoute[] = [
  {
    path: '/configuracao/acessos/consultar',
    name: 'Consultar Acessos',
    component: lazy(() => import('@/pages/Configuracoes/Acessos/Consultar')),
    meta: { area: 'config', menu: true, requiresAuth: true },
  },
  {
    path: '/configuracao/acessos/usuario',
    name: 'Acesso por Usuário',
    component: lazy(() => import('@/pages/Configuracoes/Acessos/Usuario')),
    meta: { area: 'config', menu: true, requiresAuth: true },
  },
  {
    path: '/configuracao/acessos/grupo',
    name: 'Acesso por Grupo',
    component: lazy(() => import('@/pages/Configuracoes/Acessos/Grupo')),
    meta: { area: 'config', menu: true, requiresAuth: true },
  },
  {
    path: '/configuracao/usuarios/cadastrar',
    name: 'Cadastrar Usuário',
    component: lazy(() => import('@/pages/Usuarios/CadastrarUsuario')),
    meta: { area: 'config', menu: true, requiresAuth: true },
  },
  {
    path: '/configuracao/usuarios/consultar',
    name: 'Consultar Usuário',
    component: lazy(() => import('@/pages/Usuarios/ConsultarUsuario')),
    meta: { area: 'config', menu: true, requiresAuth: true },
  },
  {
    path: '/configuracao/tema',
    name: 'Configurar Tema',
    component: lazy(() => import('@/pages/Configuracoes/ConfigurarTema')),
    meta: { area: 'config', menu: true, requiresAuth: true },
  },
  {
    path: '/configuracao/logs',
    name: 'Logs',
    component: lazy(() => import('@/pages/Logs/Logs')),
    meta: { area: 'config', menu: true, requiresAuth: true },
  },
]

export default routesConfig
