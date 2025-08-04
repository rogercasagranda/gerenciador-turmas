# --- NOVO ENDPOINT: Login via token Google --- #

# Importa a biblioteca do Google para validação de tokens
from google.oauth2 import id_token
from google.auth.transport import requests

# Define modelo de entrada para login com Google
class GoogleToken(BaseModel):
    token: str  # Token JWT recebido do frontend

# Endpoint para autenticação via Google
@router.post("/login/google")
async def login_google(data: GoogleToken, request: Request):
    try:
        # Valida o token JWT com a chave pública da Google
        idinfo = id_token.verify_oauth2_token(
            data.token,
            requests.Request(),
            os.getenv("GOOGLE_CLIENT_ID")  # Define o client_id esperado (deve estar no .env)
        )

        # Extrai o ID do usuário Google
        google_id = idinfo["sub"]  # Sub = subject = ID único do usuário Google

        # Extrai o nome (opcional, pode ser salvo no cadastro)
        nome = idinfo.get("name", "")
        email = idinfo.get("email", "")

    except ValueError:
        # Token inválido
        raise HTTPException(status_code=401, detail="Token inválido")

    # Busca usuário no banco de dados com base no google_id
    pool: asyncpg.pool.Pool = request.app.state.db
    query = "SELECT * FROM usuarios WHERE google_id = $1"
    user = await pool.fetchrow(query, google_id)

    if not user:
        # Usuário com esse google_id não cadastrado
        raise HTTPException(status_code=403, detail="Usuário não encontrado. Acesso negado.")

    # Retorna dados mínimos ao frontend
    return {
        "mensagem": "Login com Google realizado com sucesso",
        "usuario_id": str(user["id"]),
        "nome": user["nome"]
    }
