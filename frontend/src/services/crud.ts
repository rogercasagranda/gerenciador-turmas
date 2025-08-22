// Importa o wrapper de requisições autenticadas
import { authFetch } from './api'

// Trata a resposta do fetch verificando erros e convertendo para JSON
async function handle<T>(res: Response): Promise<T> {
  // Se a resposta não for OK (status 200-299)
  if (!res.ok) {
    // Tenta extrair o payload de erro
    let payload: any = {}
    try { payload = await res.json() } catch {}
    // Lança erro com a mensagem vinda do backend
    throw new Error(payload?.detail || 'Erro na API')
  }
  // Converte e retorna o JSON tipado
  return res.json() as Promise<T>
}

// Lista registros de um recurso específico
export async function list<T>(resource: string): Promise<T[]> {
  // Faz requisição GET para o recurso
  const res = await authFetch(`/${resource}`)
  // Processa e devolve os dados
  return handle<T[]>(res)
}

// Cria um novo registro para o recurso
export async function create<T>(resource: string, data: any): Promise<T> {
  // Realiza requisição POST enviando o corpo em JSON
  const res = await authFetch(`/${resource}`, {
    method: 'POST', // Método HTTP
    body: JSON.stringify(data), // Corpo serializado
  })
  // Processa a resposta
  return handle<T>(res)
}

// Atualiza um registro existente
export async function update<T>(resource: string, id: number, data: any): Promise<T> {
  // Envia requisição PUT para o recurso/id
  const res = await authFetch(`/${resource}/${id}`, {
    method: 'PUT', // Método de atualização
    body: JSON.stringify(data), // Corpo JSON com dados
  })
  // Processa e retorna
  return handle<T>(res)
}

// Remove um registro
export async function remove(resource: string, id: number): Promise<void> {
  // Executa requisição DELETE no recurso/id
  const res = await authFetch(`/${resource}/${id}`, {
    method: 'DELETE', // Método de exclusão
  })
  // Usa handle para lançar erro caso ocorra
  await handle(res)
}
