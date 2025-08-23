# === Base ===
FROM python:3.12-slim

# Evita .pyc e buffer
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Dependências de sistema mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential bash curl && \
    rm -rf /var/lib/apt/lists/*

# Instala Python deps usando o requirements.txt da RAIZ
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copia o código inteiro (raiz -> /app)
COPY . /app

# Cloud Run injeta PORT=8080; garantir que o server escute aqui
ENV PORT=8080
EXPOSE 8080

# Servidor: gunicorn + uvicorn worker apontando para backend.main:app
# (ajuste somente se teu módulo/objeto diferirem)
CMD exec gunicorn backend.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:${PORT} \
    --timeout 120 \
    --graceful-timeout 30 \
    --workers 1 \
    --threads 4
