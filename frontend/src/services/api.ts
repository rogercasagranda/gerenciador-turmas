// ============================================================
// frontend/src/services/api.ts
// Serviço central de chamadas HTTP ao backend (FastAPI)
// Mantém API base via .env (VITE_API_URL) e token JWT (local/session)
// ============================================================

// Declara API base a partir das variáveis de ambiente do Vite
// Expõe erro claro se a variável não estiver definida
export const API_BASE: string = (() => {
  // Lê variável do Vite
  const url = import.meta.env.VITE_API_URL as string | undefined
  // Valida existência
  if (!url) {
    // Gera erro descritivo para facilitar debug em produção e dev
    throw new Error(
      "[API] VITE_API_URL não definida. Configure no frontend/.env e no Render → Environment."
    )
  }
  // Remove barra final para evitar // nas rotas
  return url.replace(/\/+$/, "")
})()

// ============================================================
// Gestão de token (JWT)
// ============================================================

// Obtém token do localStorage (persistente) ou sessionStorage (sessão)
export function getAuthToken(): string | null {
  // Tenta obter do armazenamento persistente
  const fromLocal =
    localStorage.getItem("authToken") || localStorage.getItem("auth_token")
  if (fromLocal) return fromLocal
  return (
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("auth_token")
  )
}

// Salva token conforme “Continuar conectado” (true → localStorage, false → sessionStorage)
export function setAuthToken(token: string, lembrar: boolean): void {
  // Limpa tokens anteriores para evitar conflitos
  localStorage.removeItem("authToken")
  sessionStorage.removeItem("authToken")
  // Define destino de armazenamento conforme escolha do usuário
  if (lembrar) {
    // Armazena de forma persistente
    localStorage.setItem("authToken", token)
  } else {
    // Armazena na sessão atual
    sessionStorage.setItem("authToken", token)
  }
  // Loga tamanho do token para auditoria
  try {
    console.log(`[auth] token length: ${token.length}`)
  } catch {}
}

// Remove token de ambos os armazenamentos
export function clearAuthToken(): void {
  // Remove do localStorage
  localStorage.removeItem("authToken")
  // Remove do sessionStorage
  sessionStorage.removeItem("authToken")
}

// Remove apenas o token armazenado (local ou sessão)
function clearCurrentAuthToken(): void {
  if (localStorage.getItem("authToken") !== null) {
    localStorage.removeItem("authToken")
  } else if (sessionStorage.getItem("authToken") !== null) {
    sessionStorage.removeItem("authToken")
  }
}

// Logout controlado: limpa token atual e redireciona para login
function logoutControlled(): void {
  clearCurrentAuthToken()
  window.location.href = "/login"
}

// ============================================================
// Fetch centralizado com anexação automática de Authorization
// ============================================================

export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<any> {
  const token = getAuthToken()
  const headers = new Headers(init.headers || {})
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const url = `${API_BASE}${input.startsWith("/") ? "" : "/"}${input}`

  const res = await fetch(url, { ...init, headers })

  // 401 → token inválido/expirado: limpa token e força login
  if (res.status === 401) {
    clearAuthToken()
    window.dispatchEvent(new Event("auth:unauthorized"))
  }

  const text = await res.text()
  const ct = res.headers.get("content-type") || ""
  let data: any = null
  if (ct.includes("application/json") && text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  } else {
    data = text
  }

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message)) || res.statusText || "Erro na requisição"
    const err: any = new Error(msg)
    err.status = res.status
    err.payload = data
    throw err
  }

  return data
}

// ============================================================
// Utilitário de requisições (fetch) com headers e tratamento de erros
// ============================================================

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

// Define shape padrão de erro retornado pelo backend
export interface ApiErrorPayload {
  detail?: string | { msg?: string }[] | Record<string, unknown>
  message?: string
  [key: string]: unknown
}

// Erro customizado incluindo status HTTP e payload retornado
export class ApiError extends Error {
  status: number
  payload?: ApiErrorPayload

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

// Lança erro com mensagem amigável consolidando possíveis formatos do backend
function raiseHttpError(res: Response, payload?: ApiErrorPayload): never {
  // Extrai status e texto padrão
  const base = `HTTP ${res.status} ${res.statusText}`
  // Extrai mensagem de payload quando existir
  let reason = ""
  // Tenta mapear campos comuns (detail/message)
  if (payload) {
    if (typeof payload.detail === "string") reason = payload.detail
    else if (Array.isArray(payload.detail)) {
      // Concatena mensagens de validação (FastAPI/Pydantic)
      reason = payload.detail.map((x) => (x as any)?.msg ?? "").filter(Boolean).join(" | ")
    } else if (typeof payload.message === "string") {
      reason = payload.message
    } else {
      // Serializa objeto desconhecido para inspeção
      try {
        reason = JSON.stringify(payload)
      } catch {
        reason = "[payload não serializável]"
      }
    }
  }
  // Cria erro final com base e razão
  const msg = reason ? `${base} • ${reason}` : base
  // Lança erro com status e payload para tratamento específico
  throw new ApiError(res.status, msg, payload)
}

// Faz requisição com AbortController e timeout opcional
export async function apiRequest<T = unknown>(
  path: string,
  options: {
    method?: HttpMethod
    body?: unknown
    headers?: Record<string, string>
    timeoutMs?: number
    withAuth?: boolean
  } = {}
): Promise<T> {
  // Desestrutura opções com defaults
  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = 20000,
    withAuth = true,
  } = options

  // Monta URL final removendo barras duplicadas
  const url = `${API_BASE}/${path.replace(/^\/+/, "")}`

  // Prepara headers base
  const baseHeaders: Record<string, string> = {
    // Define JSON por padrão quando houver body
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    // Mescla headers customizados do chamador
    ...headers,
  }

  // Anexa Authorization: Bearer <token> quando solicitado e token existir
  if (withAuth) {
    const token = getAuthToken()
    if (token) {
      baseHeaders.Authorization = `Bearer ${token}`
    }
  }

  // Cria controlador para cancelar por timeout
  const controller = new AbortController()
  // Programa timeout
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Executa fetch com método, headers, corpo serializado e signal de abort
    const res = await fetch(url, {
      method,
      headers: baseHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    // Tenta identificar conteúdo JSON
    const contentType = res.headers.get("content-type") || ""
    const isJson = contentType.includes("application/json")

      // Se resposta não OK, trata conforme status
      if (!res.ok) {
        let payload: ApiErrorPayload | undefined
        try {
          payload = isJson ? await res.json() : undefined
        } catch {
          payload = undefined
        }

        if (res.status === 401) {
          const detail = typeof payload?.detail === "string" ? payload.detail.toLowerCase() : ""
          if (!payload || detail.includes("token")) {
            logoutControlled()
          }
        }

        raiseHttpError(res, payload)
      }

    // Se OK e for JSON, retorna objeto tipado T; caso contrário, retorna como any (texto/blob se necessário)
    if (isJson) {
      return (await res.json()) as T
    }
    // Retorna string para respostas não-JSON
    return (await res.text()) as unknown as T
  } catch (err: any) {
    // Trata abort/timeout com mensagem clara
    if (err?.name === "AbortError") {
      throw new Error("Tempo de requisição esgotado. Verificar conectividade ou serviço indisponível.")
    }
    // Propaga demais erros
    throw err
  } finally {
    // Limpa timer de timeout
    clearTimeout(timeoutId)
  }
}



// ============================================================
// Endpoints específicos utilizados pelo Portal do Professor
// ============================================================

// Tipo do payload de login (alias aceitos no backend: usuario|username, senha|password)
export interface LoginRequest {
  usuario?: string
  username?: string
  senha?: string
  password?: string
  lembrar?: boolean // Define armazenamento do token (true → localStorage)
}

// Tipo da resposta de login (esperado: token e dados do usuário)
export interface LoginResponse {
  access_token: string
  token_type: string
  usuario?: {
    id_usuario?: number
    email?: string
    nome?: string
    tipo_perfil?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

// Executa login e persiste token conforme “lembrar”
export async function login(data: LoginRequest): Promise<LoginResponse> {
  // Extrai flag lembrar (default false)
  const lembrar = Boolean(data.lembrar)
  // Remove campo lembrar do body enviado ao backend
  const { lembrar: _, ...payload } = data
  // Chama rota de login do backend (respeita aliases)
  const res = await apiRequest<LoginResponse>("/login", {
    method: "POST",
    body: payload,
    withAuth: false, // Não envia Authorization antes de logar
  })
  // Persiste token no armazenamento conforme flag
  if (res?.access_token) {
    setAuthToken(res.access_token, lembrar)
  }
  // Retorna resposta completa para uso do chamador
  return res
}

// Exclui usuário por ID (autenticado com Bearer)
export async function deleteUsuario(id: number): Promise<{ message: string }> {
  // Valida entrada
  if (!Number.isFinite(id)) {
    throw new Error("ID inválido para exclusão de usuário.")
  }
  // Executa DELETE em /usuarios/:id
  return await apiRequest<{ message: string }>(`/usuarios/${id}`, {
    method: "DELETE",
  })
}

// Consulta “/health” (se existir) para testar conectividade do backend
export async function apiHealthCheck(): Promise<unknown> {
  // Chama rota pública de verificação quando disponível
  return await apiRequest("/health", { method: "GET", withAuth: false })
}

// Busca usuários (exemplo de GET autenticado)
// Ajusta rota conforme sua API (e.g., /usuarios?pagina=1&limite=20)
export interface Usuario {
  id_usuario: number
  nome: string
  email: string
  tipo_perfil: string
  ativo: boolean
  [key: string]: unknown
}
export interface Paginado<T> {
  items: T[]
  total: number
  page?: number
  size?: number
}
export async function listarUsuarios(params?: Record<string, string | number | boolean>): Promise<Paginado<Usuario>> {
  // Monta querystring a partir de params
  const query =
    params && Object.keys(params).length
      ? "?" +
        Object.entries(params)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : ""
  // Executa GET autenticado
  return await apiRequest<Paginado<Usuario>>(`/usuarios${query}`, { method: "GET" })
}

// Cria usuário (exemplo de POST autenticado)
// Ajusta estrutura conforme backend oficial
export interface CriarUsuarioRequest {
  nome: string
  email: string
  ddi?: string
  telefone?: string
  tipo_perfil: string
  ativo?: boolean
}
export async function criarUsuario(payload: CriarUsuarioRequest): Promise<Usuario> {
  // Executa POST em /usuarios
  return await apiRequest<Usuario>("/usuarios", { method: "POST", body: payload })
}

// Atualiza usuário (exemplo de PUT autenticado)
// Ajusta estrutura conforme backend oficial
export interface AtualizarUsuarioRequest extends Partial<CriarUsuarioRequest> {}
export async function atualizarUsuario(id: number, payload: AtualizarUsuarioRequest): Promise<Usuario> {
  // Valida id
  if (!Number.isFinite(id)) {
    throw new Error("ID inválido para atualização de usuário.")
  }
  // Executa PUT em /usuarios/:id
  return await apiRequest<Usuario>(`/usuarios/${id}`, { method: "PUT", body: payload })
}

// ============================================================
// Ano Letivo - operações específicas
// ============================================================

export interface AnoLetivo {
  id: number
  descricao: string
  data_inicio: string
  data_fim: string
}

export type AnoLetivoPayload = Omit<AnoLetivo, "id">

function handleAnoLetivoError(err: unknown): never {
  if (err instanceof ApiError) {
    if (err.status === 409) {
      throw new ApiError(409, "Descrição já existe")
    }
    if (err.status === 400) {
      throw new ApiError(400, "Data inicial deve ser menor que a final")
    }
  }
  throw err instanceof Error ? err : new Error(String(err))
}

export async function listAnosLetivos(): Promise<AnoLetivo[]> {
  try {
    return await apiRequest<AnoLetivo[]>("/ano-letivo")
  } catch (err) {
    handleAnoLetivoError(err)
  }
}

export async function createAnoLetivo(payload: AnoLetivoPayload): Promise<AnoLetivo> {
  try {
    return await apiRequest<AnoLetivo>("/ano-letivo", { method: "POST", body: payload })
  } catch (err) {
    handleAnoLetivoError(err)
  }
}

export async function updateAnoLetivo(
  id: number,
  payload: AnoLetivoPayload,
): Promise<AnoLetivo> {
  try {
    return await apiRequest<AnoLetivo>(`/ano-letivo/${id}`, { method: "PUT", body: payload })
  } catch (err) {
    handleAnoLetivoError(err)
  }
}

export async function deleteAnoLetivo(id: number): Promise<void> {
  try {
    await apiRequest(`/ano-letivo/${id}`, { method: "DELETE" })
  } catch (err) {
    handleAnoLetivoError(err)
  }
}

// Logout local (somente cliente)
// Limpa tokens locais sem chamar backend
export function logoutLocal(): void {
  // Remove credenciais locais
  clearAuthToken()
}

// ============================================================
// Dicas de uso no componente (exemplo):
// ------------------------------------------------------------
// import { login, deleteUsuario, listarUsuarios, criarUsuario, atualizarUsuario } from "@/services/api"
// 
// async function onLogin() {
//   const res = await login({ usuario: email, senha, lembrar: continuarConectado })
//   // Redireciona para /home após sucesso
// }
// 
// async function onDelete(id: number) {
//   await deleteUsuario(id)
//   // Atualiza grid após exclusão
// }
// ============================================================
