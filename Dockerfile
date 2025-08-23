# ============================================
# Base: Python 3.12 (Debian slim)
# ============================================
FROM python:3.12-slim AS base

# Evita criação de .pyc e força logs sem buffer
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Cloud Run injeta PORT; assume 8080 localmente
ENV PORT=8080
# Garante import do pacote "backend" via caminho absoluto /app
ENV PYTHONPATH=/app

# Pacotes de runtime (mínimos) e limpeza de cache APT
# - libpq5: client lib do PostgreSQL (se usar psycopg2/psycopg2-binary)
# - curl: útil para testes/healthcheck locais
RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq5 curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Cria usuário não-root p/ segurança
RUN useradd --create-home --shell /bin/bash appuser
WORKDIR /app

# ============================================
# Instala dependências Python
# ============================================
# Copia apenas requirements primeiro para aproveitar cache de camadas
COPY backend/requirements.txt /app/requirements.txt

# Recomendado: trave wheels mais comuns; FastAPI/Uvicorn/Gunicorn
# Exemplo (ajuste seu requirements.txt conforme seu projeto):
# fastapi
# uvicorn[standard]
# gunicorn
# python-dotenv
# psycopg2-binary   # se usar Postgres síncrono
# bcrypt            # se usar hashing de senha
# httpx             # se fizer chamadas HTTP
# pydantic
# python-jose[cryptography]  # se usar JWT
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r /app/requirements.txt

# ============================================
# Copia o código da aplicação
# Estrutura esperada:
#   backend/
#     main.py        -> contém: app = FastAPI()
#     ...outros módulos...
# ============================================
COPY backend /app/backend

# Muda o dono dos arquivos para o usuário não-root
RUN chown -R appuser:appuser /app
USER appuser

# ============================================
# (Opcional) Healthcheck local (Cloud Run ignora HEALTHCHECK do Docker)
# Se sua API tiver /health, ajuda em testes locais com "docker run"
# ============================================
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT}/health || exit 1

# ============================================
# Comando de inicialização
# - Gunicorn + UvicornWorker (produção)
# - Binda em 0.0.0.0:$PORT (exigência do Cloud Run)
# - Workers/threads ajustáveis via variáveis se quiser
#   Ex.: definir GUNICORN_WORKERS=2, GUNICORN_THREADS=8 no Cloud Run
# ============================================
ENV GUNICORN_WORKERS=2 \
    GUNICORN_THREADS=8 \
    GUNICORN_TIMEOUT=120

CMD gunicorn \
    -k uvicorn.workers.UvicornWorker backend.main:app \
    --bind 0.0.0.0:${PORT} \
    --workers ${GUNICORN_WORKERS} \
    --threads ${GUNICORN_THREADS} \
    --timeout ${GUNICORN_TIMEOUT} \
    --access-logfile - \
    --error-logfile - \
    --keep-alive 5
