# ============================================
# Base: Python 3.12 (Debian slim)
# ============================================
FROM python:3.12-slim AS base

# Evita .pyc e força logs sem buffer
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Cloud Run injeta PORT; 8080 é fallback local
ENV PORT=8080
# Garante import de "backend" via caminho absoluto /app
ENV PYTHONPATH=/app

# Pacotes de runtime necessários (Postgres client, certs, curl p/ health local)
RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq5 ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# Usuário não-root por segurança
RUN useradd --create-home --shell /bin/bash appuser
WORKDIR /app

# ============================================
# Dependências Python (usa cache de camada)
# ============================================
# Mantém requirements.txt no backend/ (como está no teu repo)
COPY backend/requirements.txt /app/requirements.txt

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r /app/requirements.txt

# ============================================
# Código da aplicação
# Estrutura esperada:
#   backend/
#     main.py           -> contém: app = FastAPI()
#     ...
# ============================================
COPY backend /app/backend

# Permissões para o usuário não-root
RUN chown -R appuser:appuser /app
USER appuser

# (Opcional) Healthcheck para teste local com "docker run"
# Observação: o Cloud Run ignora HEALTHCHECK do Dockerfile,
# mas ajuda a validar localmente se houver /health implementado.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:${PORT}/health || exit 1

# ============================================
# Execução (produção): Gunicorn + UvicornWorker
# - Usa `sh -c` para EXPANDIR ${PORT} e vars de tuning
# ============================================
ENV GUNICORN_WORKERS=2 \
    GUNICORN_THREADS=8 \
    GUNICORN_TIMEOUT=120

CMD ["sh","-c","gunicorn -k uvicorn.workers.UvicornWorker backend.main:app --bind 0.0.0.0:${PORT} --workers ${GUNICORN_WORKERS} --threads ${GUNICORN_THREADS} --timeout ${GUNICORN_TIMEOUT} --access-logfile - --error-logfile - --keep-alive 5"]
