# backend/routes/calendario.py
# ======================================================
# Rotas FastAPI para calendário escolar (ano letivo e feriados)
# Cada linha comentada para facilitar compreensão
# ======================================================
from fastapi import APIRouter, Depends, HTTPException, Request, status  # Importa FastAPI e utilidades
from sqlalchemy.orm import Session                                      # Importa sessão do SQLAlchemy
import requests                                                         # Importa requests para chamadas HTTP
from datetime import date                                               # Importa date para manipulação de datas

from backend.database import get_db                                    # Dependência de banco de dados
from backend.models.ano_letivo import AnoLetivo                        # Modelo de AnoLetivo
from backend.models.turma import Turma                                 # Modelo de Turma para verificar dependências
from backend.models.feriado import Feriado                             # Modelo de Feriado

from backend.schemas.turmas import (                                   # Importa schemas Pydantic
    AnoLetivoCreate, AnoLetivoOut, AnoLetivoUpdate,                    # Schemas de ano letivo
    FeriadoCreate, FeriadoOut, FeriadoUpdate,                          # Schemas de feriado
    FeriadoImportarNacionais,                                          # Schema para importação de feriados nacionais
)

from backend.routes.usuarios import token_data_from_request, to_canonical  # Utilidades de autenticação

# As demais rotas do projeto já são registradas na raiz (sem prefixo).
# Para manter consistência e atender ao frontend, removemos o prefixo
# "/api" que fazia com que os endpoints fossem expostos como
# "/api/ano-letivo". Assim, agora eles podem ser acessados diretamente
# em "/ano-letivo", alinhando backend e frontend.
router = APIRouter(tags=["Calendário"])               # Instancia roteador sem prefixo

# ------------------------------------------------------
# Controle de acesso
# ------------------------------------------------------
FULL_ACCESS = {"master", "diretor", "secretaria"}                     # Perfis com permissão total
READ_COORD = FULL_ACCESS | {"coordenador", "professor"}               # Perfis com leitura ampliada
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
def listar_anos(request: Request, db: Session = Depends(get_db)):
    if request.headers.get("Authorization"):
        require_role(request, READ_RESTRITO)                              # Valida permissão de leitura
    anos = db.query(AnoLetivo).all()                                  # Consulta anos existentes
    return {"message": "Anos letivos listados", "data": anos}         # Retorna resposta padronizada

@router.post("/ano-letivo", response_model=AnoLetivoOut, status_code=status.HTTP_201_CREATED)  # Cria ano letivo
def criar_ano(payload: AnoLetivoCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                # Exige perfis com permissão de escrita
    existente = db.query(AnoLetivo).filter(AnoLetivo.descricao == payload.descricao).first()  # Verifica duplicidade de descrição
    if existente:                                                     # Se já houver mesma descrição
        raise HTTPException(status_code=409, detail="Ano letivo já cadastrado")  # Retorna 409 de conflito
    if payload.data_inicio > payload.data_fim:                        # Valida ordem das datas
        raise HTTPException(status_code=422, detail="data_inicio deve ser menor ou igual a data_fim")  # Retorna 422
    ano = AnoLetivo(**payload.dict())                                 # Cria instância do modelo
    db.add(ano)                                                       # Adiciona à sessão
    db.commit()                                                       # Persiste no banco
    db.refresh(ano)                                                   # Atualiza com ID gerado
    return {"message": "Ano letivo criado", "data": ano}              # Retorna sucesso

@router.get("/ano-letivo/{ano_id}", response_model=AnoLetivoOut)  # Obtém ano letivo específico

def obter_ano(ano_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_RESTRITO)                              # Permite leitura ampla
    ano = db.get(AnoLetivo, ano_id)                                   # Busca registro
    if not ano:                                                       # Se não encontrado
        raise HTTPException(status_code=404, detail="Ano letivo não encontrado")  # Retorna 404
    return {"message": "Ano letivo encontrado", "data": ano}          # Retorna dados

@router.put("/ano-letivo/{ano_id}", response_model=AnoLetivoOut)      # Atualiza ano letivo
def atualizar_ano(ano_id: int, payload: AnoLetivoUpdate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                # Exige permissão total
    ano = db.get(AnoLetivo, ano_id)                                   # Busca registro
    if not ano:                                                       # Se inexistente
        raise HTTPException(status_code=404, detail="Ano letivo não encontrado")  # Retorna 404

    if payload.descricao is not None:                                # Se descrição foi informada
        existente = db.query(AnoLetivo).filter(                      # Verifica duplicidade de descrição
            AnoLetivo.descricao == payload.descricao,
            AnoLetivo.id != ano_id,
        ).first()
        if existente:                                                # Se já houver outro com mesma descrição

            raise HTTPException(status_code=409, detail="Ano letivo já cadastrado")  # Retorna conflito
    nova_inicio = payload.data_inicio or ano.data_inicio              # Determina nova data inicial
    nova_fim = payload.data_fim or ano.data_fim                       # Determina nova data final
    if nova_inicio > nova_fim:                                        # Valida ordem das datas
        raise HTTPException(status_code=422, detail="data_inicio deve ser menor ou igual a data_fim")  # Retorna 422
    for field, value in payload.dict(exclude_unset=True).items():     # Percorre campos enviados
        setattr(ano, field, value)                                    # Atualiza atributos
    db.commit()                                                       # Persiste alterações
    db.refresh(ano)                                                   # Atualiza objeto
    return {"message": "Ano letivo atualizado", "data": ano}          # Retorna sucesso

@router.delete("/ano-letivo/{ano_id}")                               # Remove ano letivo
def remover_ano(ano_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                # Exige permissão total
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
    return {"message": "Ano letivo removido"}                         # Retorna confirmação

# ------------------------------------------------------
# Endpoints de Feriados
# ------------------------------------------------------
@router.get("/feriados", response_model=list[FeriadoOut])            # Lista feriados por ano letivo
def listar_feriados(anoLetivoId: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_RESTRITO)                              # Permite leitura a todos os perfis
    feriados = db.query(Feriado).filter(Feriado.ano_letivo_id == anoLetivoId).all()  # Consulta feriados
    return {"message": "Feriados listados", "data": feriados}         # Retorna resposta

@router.post("/feriados", response_model=FeriadoOut, status_code=status.HTTP_201_CREATED)  # Cria feriado escolar
def criar_feriado(payload: FeriadoCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                # Exige permissão total
    if payload.origem != "ESCOLA":                                    # Valida origem
        raise HTTPException(status_code=422, detail="Origem deve ser 'ESCOLA'")  # Retorna 422

    ano = db.get(AnoLetivo, payload.ano_letivo_id)                    # Busca ano letivo
    if not ano or not (ano.data_inicio <= payload.data <= ano.data_fim):  # Verifica se data está no período

        raise HTTPException(status_code=422, detail="Data fora do período do ano letivo")  # Retorna 422
    existente = db.query(Feriado).filter_by(                          # Verifica duplicidade
        ano_letivo_id=payload.ano_letivo_id, data=payload.data, origem=payload.origem
    ).first()
    if existente:                                                     # Se já cadastrado
        raise HTTPException(status_code=409, detail="Feriado já cadastrado")  # Retorna 409
    fer = Feriado(**payload.dict())                                   # Cria instância
    db.add(fer)                                                       # Adiciona
    db.commit()                                                       # Persiste
    db.refresh(fer)                                                   # Atualiza
    return {"message": "Feriado criado", "data": fer}            # Retorna sucesso

@router.put("/feriados/{feriado_id}", response_model=FeriadoOut)  # Atualiza feriado
def atualizar_feriado(feriado_id: int, payload: FeriadoUpdate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                # Exige permissão total
    fer = db.get(Feriado, feriado_id)                                 # Busca registro
    if not fer:                                                       # Se inexistente
        raise HTTPException(status_code=404, detail="Feriado não encontrado")  # Retorna 404
    if fer.origem == "NACIONAL":                                     # Feriados nacionais não podem ser alterados
        raise HTTPException(status_code=403, detail="Feriados nacionais não podem ser alterados")  # Retorna 403
    if payload.data is not None:                                     # Se nova data informada
        ano = db.get(AnoLetivo, fer.ano_letivo_id)                   # Obtém ano letivo

        if not (ano.data_inicio <= payload.data <= ano.data_fim):    # Verifica se data está no período

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
    return {"message": "Feriado atualizado", "data": fer}          # Retorna sucesso

@router.delete("/feriados/{feriado_id}")                             # Remove feriado
def remover_feriado(feriado_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                # Exige permissão total
    fer = db.get(Feriado, feriado_id)                                 # Busca registro
    if not fer:                                                       # Se inexistente
        raise HTTPException(status_code=404, detail="Feriado não encontrado")  # Retorna 404
    if fer.origem != "ESCOLA":                                      # Apenas feriados escolares podem ser removidos
        raise HTTPException(status_code=403, detail="Apenas feriados de origem 'ESCOLA' podem ser removidos")  # Retorna 403
    db.delete(fer)                                                    # Remove registro
    db.commit()                                                       # Confirma
    return {"message": "Feriado removido"}                           # Retorna confirmação

@router.post("/feriados/importar-nacionais", response_model=list[FeriadoOut])  # Importa feriados nacionais
def importar_nacionais(payload: FeriadoImportarNacionais, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                # Exige permissão total

    ano = db.get(AnoLetivo, payload.ano_letivo_id)                    # Busca ano letivo
    if not ano:                                                       # Caso não exista

        raise HTTPException(status_code=404, detail="Ano letivo não encontrado")  # Retorna 404
    inseridos: list[Feriado] = []                                     # Lista para armazenar feriados criados
    for ano_civil in payload.anos:                                    # Percorre anos informados
        try:
            resp = requests.get("http://localhost:8000/feriados/nacionais", params={"ano": ano_civil}, timeout=5)  # Chama stub
            dados = resp.json() if resp.status_code == 200 else []    # Lê dados retornados
        except Exception:                                            # Em caso de erro de requisição
            dados = []                                               # Considera lista vazia
        for item in dados:                                           # Percorre feriados retornados
            data_item = date.fromisoformat(item["data"])            # Converte data para objeto date

            if not (ano.data_inicio <= data_item <= ano.data_fim):    # Verifica se data pertence ao período
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
    return {"message": "Feriados importados", "data": inseridos}     # Retorna feriados inseridos

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

