# Configuração da SECRET_KEY

A aplicação utiliza tokens JWT para autenticação e **exige** que a variável de ambiente `SECRET_KEY` esteja definida.
Sem essa variável o backend não inicia.

## Desenvolvimento

Crie um arquivo `.env` na pasta `backend/` ou defina a variável no ambiente antes de executar o servidor:

```bash
export SECRET_KEY="sua-chave-segura"
uvicorn backend.main:app
```

## Produção

Defina `SECRET_KEY` no ambiente de execução da aplicação utilizando o mecanismo de secrets do seu provedor ou um arquivo `.env` seguro. Nunca versione este valor.
