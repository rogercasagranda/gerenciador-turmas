# backend/routes/calendario.py
# ======================================================
# Rotas FastAPI para calendário escolar (ano letivo e feriados)
# Cada linha comentada para facilitar compreensão
# ======================================================
from fastapi import APIRouter, Depends, HTTPException, Request, status  # Importa FastAPI e utilidades
from sqlalchemy.orm import Session                                      # Importa sessão do SQLAlchemy
from sqlalchemy import func                                             # Funções SQL auxiliares
import requests                                                         # Importa requests para chamadas HTTP
from datetime import date                                               # Importa date para manipulação de datas
import os                                                              # Importa os para variáveis de ambiente

import json                                                            # Serializa payloads para log

from typing import Generator                                           # Utilizado nas dependências de banco
from jose import jwt, JWTError                                         # JWT para autenticação
from pydantic import BaseModel, EmailStr                               # Modelos Pydantic utilizados abaixo

from backend.models import AnoLetivo                                   # Modelo de AnoLetivo
from backend.models.turma import Turma                                 # Modelo de Turma para verificar dependências
from backend.models.feriado import Feriado                             # Modelo de Feriado

from backend.schemas.turmas import (                                   # Importa schemas Pydantic
    AnoLetivoCreate, AnoLetivoOut, AnoLetivoUpdate,                    # Schemas de ano letivo
    FeriadoCreate, FeriadoOut, FeriadoUpdate,                          # Schemas de feriado
    FeriadoImportarNacionais,                                          # Schema para importação de feriados nacionais
)

from backend.utils.audit import registrar_log                          # Função para auditoria

# As demais rotas do projeto já são registradas na raiz (sem prefixo).
# Para manter consistência e atender ao frontend, removemos o prefixo
# "/api" que fazia com que os endpoints fossem expostos como
# "/api/ano-letivo". Assim, agora eles podem ser acessados diretamente
# em "/ano-letivo", alinhando backend e frontend.
router = APIRouter(tags=["Calendário"])               # Instancia roteador sem prefixo

# Base para chamadas externas de feriados
FERIADOS_API_BASE = os.getenv("FERIADOS_API_BASE", "").rstrip("/")

# Configuração de JWT
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
ALGORITHM = "HS256"


class TokenData(BaseModel):
    id_usuario: int
    email: EmailStr
    tipo_perfil: str | None = None


def to_canonical(perfil: str | None) -> str:
    """Normaliza descrições de perfil."""
    p = (perfil or "").strip().lower()
    if p.startswith("diretor"):
        return "diretor"
    if p.startswith("coordenador"):
        return "coordenador"
    if p.startswith("professor"):
        return "professor"
    if p in {"aluno", "aluna"}:
        return "aluno"
    return p


def token_data_from_request(request: Request) -> TokenData:
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token ausente.")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        id_usuario = payload.get("id_usuario")
        tipo_perfil = payload.get("tipo_perfil")
        if sub is None or id_usuario is None:
            raise HTTPException(status_code=401, detail="Token inválido.")
        return TokenData(id_usuario=int(id_usuario), email=str(sub), tipo_perfil=tipo_perfil)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido.")


def get_db_dep() -> Generator[Session, None, None]:
    """Importa ``get_db`` apenas quando necessário."""
    from backend.database import get_db as _get_db
    yield from _get_db()

# ------------------------------------------------------
# Controle de acesso
# ------------------------------------------------------
WRITE_ACCESS = {"master", "diretor"}                                 # Perfis com permissão de escrita
READ_COORD = WRITE_ACCESS | {"secretaria", "coordenador", "professor"}  # Perfis com leitura ampliada
READ_RESTRITO = READ_COORD | {"aluno", "responsavel"}                 # Perfis com leitura restrita

def require_role(request: Request, allowed: set[str]):                # Função auxiliar de autorização
    token = token_data_from_request(request)                          # Extrai dados do token
    perfil = to_canonical(token.tipo_perfil)                          # Normaliza o perfil
    if perfil not in allowed:                                         # Verifica se tem permissão
        raise HTTPException(status_code=403, detail="Não autorizado") # Retorna 403 se proibido
    return token                                                      # Retorna dados do token quando autorizado

# ------------------------------------------------------
# Endpoints de Ano Letivo
# ------------------------------------------------------
@router.get("/ano-letivo", response_model=list[AnoLetivoOut])         # Lista todos os anos letivos
def listar_anos(request: Request, db: Session = Depends(get_db_dep)):
    require_role(request, READ_RESTRITO)                              # Exige qualquer perfil autenticado
    anos = db.query(AnoLetivo).all()                                  # Consulta anos existentes
    return anos                                                       # Retorna lista simples

@router.post("/ano-letivo", response_model=AnoLetivoOut, status_code=status.HTTP_201_CREATED)  # Cria ano letivo

def criar_ano(payload: AnoLetivoCreate, request: Request, db: Session = Depends(get_db_dep)):
    token = require_role(request, WRITE_ACCESS)                       # Exige perfis com permissão de escrita
    existente = db.query(AnoLetivo).filter(                           # Verifica duplicidade de descrição (case-insens)
        func.lower(AnoLetivo.descricao) == payload.descricao.lower()
    ).first()

    if existente:                                                     # Se já houver mesma descrição
        raise HTTPException(status_code=400, detail="Descrição já cadastrada")
    if payload.data_inicio >= payload.data_fim:                       # Valida ordem das datas
        raise HTTPException(status_code=400, detail="data_inicio deve ser menor que data_fim")

    dados = payload.model_dump()                                      # Extrai dados do payload
    ano = AnoLetivo(
        descricao=dados["descricao"],
        inicio=dados["data_inicio"],
        fim=dados["data_fim"],
    )                                                                 # Cria instância do modelo
    db.add(ano)                                                       # Adiciona à sessão
    db.commit()                                                       # Persiste no banco
    db.refresh(ano)                                                   # Atualiza com ID gerado
    resumo = json.dumps(payload.model_dump(), default=str, ensure_ascii=False)[:200]  # Resumo do payload
    registrar_log(db, token.id_usuario, "CREATE", "ano_letivo", ano.id, f"({token.tipo_perfil}) {resumo}")
    return ano                                                        # Retorna ano criado


@router.get("/ano-letivo/{ano_id}", response_model=AnoLetivoOut)  # Obtém ano letivo específico

def obter_ano(ano_id: int, request: Request, db: Session = Depends(get_db_dep)):
    require_role(request, READ_RESTRITO)                              # Permite leitura ampla
    ano = db.get(AnoLetivo, ano_id)                                   # Busca registro
    if not ano:                                                       # Se não encontrado
        raise HTTPException(status_code=404, detail="Ano letivo não encontrado")  # Retorna 404
    return ano                                                        # Retorna ano encontrado

@router.put("/ano-letivo/{ano_id}", response_model=AnoLetivoOut)      # Atualiza ano letivo

def atualizar_ano(ano_id: int, payload: AnoLetivoUpdate, request: Request, db: Session = Depends(get_db_dep)):
    token = require_role(request, WRITE_ACCESS)                       # Exige permissão de escrita

    ano = db.get(AnoLetivo, ano_id)                                   # Busca registro
    if not ano:                                                       # Se inexistente
        raise HTTPException(status_code=404, detail="Ano letivo não encontrado")  # Retorna 404

    if payload.descricao is not None:                                # Se descrição foi informada
        existente = db.query(AnoLetivo).filter(                      # Verifica duplicidade (case-insens)
            func.lower(AnoLetivo.descricao) == payload.descricao.lower(),
            AnoLetivo.id != ano_id,
        ).first()
        if existente:                                                # Se já houver outro com mesma descrição

            raise HTTPException(status_code=409, detail="Ano letivo já cadastrado")  # Retorna conflito

    nova_inicio = payload.data_inicio or ano.inicio                   # Determina nova data inicial
    nova_fim = payload.data_fim or ano.fim                            # Determina nova data final
    if nova_inicio >= nova_fim:                                      # Valida ordem das datas
        raise HTTPException(status_code=400, detail="data_inicio deve ser menor que data_fim")

    dados = payload.model_dump(exclude_unset=True)                    # Dados enviados
    if "data_inicio" in dados:
        dados["inicio"] = dados.pop("data_inicio")                 # Adapta para atributo do modelo
    if "data_fim" in dados:
        dados["fim"] = dados.pop("data_fim")                       # Adapta para atributo do modelo
    for field, value in dados.items():                                 # Percorre campos enviados
        setattr(ano, field, value)                                    # Atualiza atributos
    db.commit()                                                       # Persiste alterações
    db.refresh(ano)                                                   # Atualiza objeto
    resumo = json.dumps(payload.model_dump(exclude_unset=True), default=str, ensure_ascii=False)[:200]
    registrar_log(db, token.id_usuario, "UPDATE", "ano_letivo", ano.id, f"({token.tipo_perfil}) {resumo}")
    return ano                                                        # Retorna ano atualizado


@router.delete("/ano-letivo/{ano_id}")                               # Remove ano letivo

def remover_ano(ano_id: int, request: Request, db: Session = Depends(get_db_dep)):
    token = require_role(request, WRITE_ACCESS)                       # Exige permissão de escrita

    ano = db.get(AnoLetivo, ano_id)                                   # Busca registro
    if not ano:                                                       # Se inexistente
        raise HTTPException(status_code=404, detail="Ano letivo não encontrado")  # Retorna 404
    dependencia = (                                                   # Verifica dependências em outras tabelas
        db.query(Turma).filter(Turma.ano_letivo_id == ano_id).first() or
        db.query(Feriado).filter(Feriado.ano_letivo_id == ano_id).first()
    )
    if dependencia:                                                   # Caso possua dependências
        raise HTTPException(status_code=409, detail="Ano letivo possui dependências")  # Bloqueia remoção
    db.delete(ano)                                                    # Remove registro
    db.commit()                                                       # Confirma no banco
    registrar_log(db, token.id_usuario, "DELETE", "ano_letivo", ano_id, f"({token.tipo_perfil}) id={ano_id}")
    return {"message": "Ano letivo removido"}                         # Retorna confirmação


# ------------------------------------------------------
# Endpoints de Feriados
# ------------------------------------------------------
@router.get("/feriados", response_model=list[FeriadoOut])            # Lista feriados por ano letivo
def listar_feriados(anoLetivoId: int, request: Request, db: Session = Depends(get_db_dep)):
    require_role(request, READ_RESTRITO)                              # Permite leitura a todos os perfis
    feriados = db.query(Feriado).filter(Feriado.ano_letivo_id == anoLetivoId).all()  # Consulta feriados
    return feriados                                                  # Retorna lista simples

@router.post("/feriados", response_model=FeriadoOut, status_code=status.HTTP_201_CREATED)  # Cria feriado escolar

def criar_feriado(payload: FeriadoCreate, request: Request, db: Session = Depends(get_db_dep)):
    token = require_role(request, WRITE_ACCESS)                       # Exige permissão de escrita

    if payload.origem != "ESCOLA":                                    # Valida origem
        raise HTTPException(status_code=422, detail="Origem deve ser 'ESCOLA'")  # Retorna 422

    ano = db.get(AnoLetivo, payload.ano_letivo_id)                    # Busca ano letivo

    if not ano or not (ano.inicio <= payload.data <= ano.fim):  # Verifica se data está no período

        raise HTTPException(status_code=422, detail="Data fora do período do ano letivo")  # Retorna 422
    existente = db.query(Feriado).filter_by(                          # Verifica duplicidade
        ano_letivo_id=payload.ano_letivo_id, data=payload.data, origem=payload.origem
    ).first()
    if existente:                                                     # Se já cadastrado
        raise HTTPException(status_code=409, detail="Feriado já cadastrado")  # Retorna 409
    fer = Feriado(**payload.model_dump())                              # Cria instância
    db.add(fer)                                                       # Adiciona
    db.commit()                                                       # Persiste
    db.refresh(fer)                                                   # Atualiza
    resumo = json.dumps(payload.model_dump(), default=str, ensure_ascii=False)[:200]
    registrar_log(db, token.id_usuario, "CREATE", "feriado", fer.id, f"({token.tipo_perfil}) {resumo}")
    return fer                                                        # Retorna feriado criado


@router.put("/feriados/{feriado_id}", response_model=FeriadoOut)  # Atualiza feriado

def atualizar_feriado(feriado_id: int, payload: FeriadoUpdate, request: Request, db: Session = Depends(get_db_dep)):
    token = require_role(request, WRITE_ACCESS)                       # Exige permissão de escrita

    fer = db.get(Feriado, feriado_id)                                 # Busca registro
    if not fer:                                                       # Se inexistente
        raise HTTPException(status_code=404, detail="Feriado não encontrado")  # Retorna 404
    if fer.origem == "NACIONAL":                                     # Feriados nacionais não podem ser alterados
        raise HTTPException(status_code=403, detail="Feriados nacionais não podem ser alterados")  # Retorna 403
    if payload.data is not None:                                     # Se nova data informada
        ano = db.get(AnoLetivo, fer.ano_letivo_id)                   # Obtém ano letivo

        if not (ano.inicio <= payload.data <= ano.fim):              # Verifica se data está no período

            raise HTTPException(status_code=422, detail="Data fora do período do ano letivo")  # Retorna 422
        duplicado = db.query(Feriado).filter(                         # Verifica duplicidade com outros feriados
            Feriado.id != feriado_id,
            Feriado.ano_letivo_id == fer.ano_letivo_id,
            Feriado.data == payload.data,
            Feriado.origem == fer.origem,
        ).first()
        if duplicado:                                                 # Se já existir
            raise HTTPException(status_code=409, detail="Feriado já cadastrado")  # Retorna 409
        fer.data = payload.data                                      # Atualiza data
    if payload.descricao is not None:                                # Se descrição informada
        fer.descricao = payload.descricao                            # Atualiza descrição
    db.commit()                                                       # Persiste alterações
    db.refresh(fer)                                                   # Atualiza objeto
    resumo = json.dumps(payload.model_dump(exclude_unset=True), default=str, ensure_ascii=False)[:200]
    registrar_log(db, token.id_usuario, "UPDATE", "feriado", fer.id, f"({token.tipo_perfil}) {resumo}")
    return fer                                                        # Retorna feriado atualizado


@router.delete("/feriados/{feriado_id}")                             # Remove feriado

def remover_feriado(feriado_id: int, request: Request, db: Session = Depends(get_db_dep)):
    token = require_role(request, WRITE_ACCESS)                       # Exige permissão de escrita

    fer = db.get(Feriado, feriado_id)                                 # Busca registro
    if not fer:                                                       # Se inexistente
        raise HTTPException(status_code=404, detail="Feriado não encontrado")  # Retorna 404
    if fer.origem != "ESCOLA":                                      # Apenas feriados escolares podem ser removidos
        raise HTTPException(status_code=403, detail="Apenas feriados de origem 'ESCOLA' podem ser removidos")  # Retorna 403
    db.delete(fer)                                                    # Remove registro
    db.commit()                                                       # Confirma
    registrar_log(db, token.id_usuario, "DELETE", "feriado", feriado_id, f"({token.tipo_perfil}) id={feriado_id}")
    return {"message": "Feriado removido"}                           # Retorna confirmação


@router.post("/feriados/importar-nacionais", response_model=list[FeriadoOut])  # Importa feriados nacionais

def importar_nacionais(payload: FeriadoImportarNacionais, request: Request, db: Session = Depends(get_db_dep)):
    token = require_role(request, WRITE_ACCESS)                       # Exige permissão de escrita


    ano = db.get(AnoLetivo, payload.ano_letivo_id)                    # Busca ano letivo
    if not ano:                                                       # Caso não exista
        raise HTTPException(status_code=404, detail="Ano letivo não encontrado")  # Retorna 404
    inseridos: list[Feriado] = []                                     # Lista para armazenar feriados criados
    for ano_civil in payload.anos:                                    # Percorre anos informados
        try:
            url = f"{FERIADOS_API_BASE}/feriados/nacionais"
            resp = requests.get(url, params={"ano": ano_civil}, timeout=5)
            dados = resp.json() if resp.status_code == 200 else []    # Lê dados retornados
        except Exception:
            dados = []                                               # Considera lista vazia
        for item in dados:                                           # Percorre feriados retornados
            data_item = date.fromisoformat(item["data"])            # Converte data para objeto date

            if not (ano.inicio <= data_item <= ano.fim):             # Verifica se data pertence ao período

                continue                                             # Ignora data fora do período
            existente = db.query(Feriado).filter_by(                  # Verifica duplicidade
                ano_letivo_id=payload.ano_letivo_id,
                data=data_item,
                origem="NACIONAL",
            ).first()
            if existente:                                            # Se já cadastrado
                continue                                             # Ignora duplicata
            fer = Feriado(                                           # Cria instância
                ano_letivo_id=payload.ano_letivo_id,
                data=data_item,
                descricao=item["descricao"],
                origem="NACIONAL",
            )
            db.add(fer)                                             # Adiciona à sessão
            inseridos.append(fer)                                   # Guarda para retorno
    db.commit()                                                     # Persiste todos
    for fer in inseridos:                                           # Atualiza objetos com IDs
        db.refresh(fer)
    resumo = json.dumps(payload.model_dump(), default=str, ensure_ascii=False)[:200]
    registrar_log(db, token.id_usuario, "CREATE", "feriado", payload.ano_letivo_id, f"({token.tipo_perfil}) import {resumo}")
    return inseridos                                                 # Retorna feriados inseridos


# ------------------------------------------------------
# Stub de feriados nacionais
# ------------------------------------------------------
@router.get("/feriados/nacionais")                                  # Endpoint stub de feriados nacionais
def feriados_nacionais(ano: int):
    base = {
        2024: [
            {"data": "2024-01-01", "descricao": "Confraternização Universal"},
            {"data": "2024-04-21", "descricao": "Tiradentes"},
        ],
        2025: [
            {"data": "2025-01-01", "descricao": "Confraternização Universal"},
        ],
    }
    return base.get(ano, [])                                         # Retorna lista conforme ano

