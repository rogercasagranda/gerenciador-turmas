# backend/routes/turmas.py
# ======================================================
# Rotas FastAPI para o módulo de Turmas
# Cada linha comentada para auxiliar entendimento
# ======================================================
from fastapi import APIRouter, Depends, HTTPException, Request, status           # Importa utilidades do FastAPI
from sqlalchemy.orm import Session                                             # Importa sessão do SQLAlchemy
from sqlalchemy import and_                                                     # Importa operador lógico

from backend.database import get_db                                            # Função de dependência do banco
from backend.models.turno import Turno                                         # Modelo Turno
from backend.models.turma import Turma                                         # Modelo Turma
from backend.models.turma_aluno import TurmaAluno                              # Modelo TurmaAluno
from backend.models.aluno import Aluno                                         # Modelo Aluno
from backend.models.turma_disciplina import TurmaDisciplina                    # Modelo TurmaDisciplina
from backend.models.disciplina import Disciplina                               # Modelo Disciplina
from backend.models.professor import Professor                                 # Modelo Professor
from backend.models.responsavel import Responsavel                             # Modelo Responsavel
from backend.models.aluno_responsavel import AlunoResponsavel                  # Modelo AlunoResponsavel
from backend.models.horario import Horario                                     # Modelo Horario
from backend.models.feriado import Feriado                                     # Modelo Feriado

from backend.schemas.turmas import (                                          # Importa schemas Pydantic
    TurnoOut,                                                                 # Schema de saída de turno
    TurmaCreate, TurmaOut, TurmaUpdate,
    TurmaAlunoCreate, AlunoOut, TurmaDisciplinaCreate,
    DisciplinaCreate, DisciplinaOut, DisciplinaUpdate,
    ProfessorCreate, ProfessorOut, ProfessorUpdate,
    ResponsavelCreate, ResponsavelOut, ResponsavelUpdate,
    AlunoResponsavelCreate,
    HorarioCreate, HorarioOut, HorarioUpdate,
)

from backend.routes.usuarios import token_data_from_request, to_canonical       # Reutiliza validação de token

router = APIRouter(prefix="/api", tags=["Turmas"])                            # Instancia roteador com prefixo /api

# ------------------------------------------------------
# Funções auxiliares de autorização
# ------------------------------------------------------
FULL_ACCESS = {"master", "diretor", "secretaria"}                             # Perfis com acesso total
READ_COORD = FULL_ACCESS | {"coordenador", "professor"}                      # Perfis com leitura ampliada
READ_RESTRITO = READ_COORD | {"aluno", "responsavel"}                        # Perfis com leitura restrita

def require_role(request: Request, allowed: set[str]):                        # Valida perfil do token
    token = token_data_from_request(request)                                   # Extrai dados do token
    perfil = to_canonical(token.tipo_perfil)                                   # Normaliza perfil
    if perfil not in allowed:                                                 # Verifica se permitido
        raise HTTPException(status_code=403, detail="Não autorizado")         # Lança 403 quando não autorizado
    return token                                                              # Retorna token para uso

# ------------------------------------------------------
# Rotas de Turno
# ------------------------------------------------------
@router.get("/turnos", response_model=list[TurnoOut])                         # Lista turnos
def listar_turnos(request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_RESTRITO)                                      # Permite qualquer perfil autenticado
    turnos = db.query(Turno).all()                                            # Consulta todos os turnos
    return turnos                                                             # Retorna lista simples

# ------------------------------------------------------
# Rotas de Turma
# ------------------------------------------------------
@router.get("/turmas", response_model=list[TurmaOut])                        # Lista turmas
def listar_turmas(request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_COORD)                                         # Exige leitura ampliada
    turmas = db.query(Turma).all()                                            # Consulta todas as turmas
    return turmas                                                             # Retorna lista simples

@router.post("/turmas", response_model=TurmaOut, status_code=status.HTTP_201_CREATED)
def criar_turma(payload: TurmaCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    turma = Turma(**payload.dict())                                           # Cria turma
    db.add(turma)                                                             # Adiciona
    db.commit()                                                               # Persiste
    db.refresh(turma)                                                         # Atualiza
    return turma                                                              # Retorna turma criada

@router.get("/turmas/{turma_id}", response_model=TurmaOut)                   # Obtém turma específica
def obter_turma(turma_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_RESTRITO)                                      # Permite qualquer perfil autenticado
    turma = db.get(Turma, turma_id)                                           # Busca turma
    if not turma:                                                             # Verifica existência
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    return turma                                                              # Retorna turma encontrada

@router.put("/turmas/{turma_id}", response_model=TurmaOut)                   # Atualiza turma
def atualizar_turma(turma_id: int, payload: TurmaUpdate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    turma = db.get(Turma, turma_id)                                           # Busca turma
    if not turma:                                                             # Verifica existência
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    for field, value in payload.dict(exclude_unset=True).items():             # Atualiza campos
        setattr(turma, field, value)                                          # Define atributo
    db.commit()                                                               # Persiste
    db.refresh(turma)                                                         # Atualiza
    return turma                                                              # Retorna turma atualizada

@router.delete("/turmas/{turma_id}")                                         # Remove turma
def remover_turma(turma_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    turma = db.get(Turma, turma_id)                                           # Busca turma
    if not turma:                                                             # Verifica existência
        raise HTTPException(status_code=404, detail="Turma não encontrada")
    db.delete(turma)                                                          # Remove
    db.commit()                                                               # Persiste
    return {"message": "Turma removida"}                                   # Confirma

# ------------------------------------------------------
# Rotas de alunos por turma
# ------------------------------------------------------
@router.get("/turmas/{turma_id}/alunos", response_model=list[AlunoOut])      # Lista alunos de uma turma
def listar_alunos_turma(turma_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_COORD)                                         # Exige leitura ampliada
    alunos = (
        db.query(Aluno)                                                       # Consulta alunos
        .join(TurmaAluno, TurmaAluno.aluno_id == Aluno.id)                    # Junta com vínculo
        .filter(TurmaAluno.turma_id == turma_id)                              # Filtra pela turma
        .all()                                                                # Executa
    )
    return alunos                                                             # Retorna lista simples

@router.post("/turmas/{turma_id}/alunos", status_code=status.HTTP_201_CREATED)
def adicionar_aluno_turma(turma_id: int, payload: TurmaAlunoCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    vinc = TurmaAluno(turma_id=turma_id, aluno_id=payload.aluno_id, dt_matricula=payload.dt_matricula)  # Cria vínculo
    db.add(vinc)                                                              # Adiciona
    db.commit()                                                               # Persiste
    db.refresh(vinc)                                                          # Atualiza
    return {"message": "Aluno vinculado", "data": {"id": vinc.id}}     # Retorna ID do vínculo

@router.delete("/turmas/{turma_id}/alunos")                                 # Remove aluno da turma
def remover_aluno_turma(turma_id: int, aluno_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    vinc = (
        db.query(TurmaAluno)                                                  # Consulta vínculo
        .filter(and_(TurmaAluno.turma_id == turma_id, TurmaAluno.aluno_id == aluno_id))
        .first()
    )
    if not vinc:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    db.delete(vinc)                                                           # Remove
    db.commit()                                                               # Persiste
    return {"message": "Aluno desvinculado"}                               # Confirma

# ------------------------------------------------------
# Rotas de disciplinas por turma
# ------------------------------------------------------
@router.get("/turmas/{turma_id}/disciplinas")                               # Lista disciplinas de uma turma
def listar_disciplinas_turma(turma_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_COORD)                                         # Exige leitura ampliada
    registros = (
        db.query(TurmaDisciplina, Disciplina)                                 # Consulta vínculo e disciplina
        .join(Disciplina, TurmaDisciplina.disciplina_id == Disciplina.id)     # Junta tabelas
        .filter(TurmaDisciplina.turma_id == turma_id)                         # Filtra pela turma
        .all()
    )
    dados = [                                                                 # Monta lista de saída
        {
            "id": disc.id,                                                 # ID da disciplina
            "nome": disc.nome,                                             # Nome
            "carga_horaria": disc.carga_horaria,                           # Carga horária
            "professor_id": td.professor_responsavel_id                    # Professor responsável
        }
        for td, disc in registros
    ]
    return dados                                                              # Retorna lista simples

@router.post("/turmas/{turma_id}/disciplinas", status_code=status.HTTP_201_CREATED)
def adicionar_disciplina_turma(turma_id: int, payload: TurmaDisciplinaCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    existente = (
        db.query(TurmaDisciplina)                                             # Consulta vínculo existente
        .filter(and_(TurmaDisciplina.turma_id == turma_id, TurmaDisciplina.disciplina_id == payload.disciplina_id))
        .first()
    )
    if existente:                                                             # Verifica conflito
        raise HTTPException(status_code=409, detail="Disciplina já cadastrada para a turma")
    vinc = TurmaDisciplina(                                                   # Cria vínculo
        turma_id=turma_id,
        disciplina_id=payload.disciplina_id,
        professor_responsavel_id=payload.professor_id,
    )
    db.add(vinc)                                                              # Adiciona
    db.commit()                                                               # Persiste
    db.refresh(vinc)                                                          # Atualiza
    return {"message": "Disciplina vinculada", "data": {"id": vinc.id}} # Retorna ID do vínculo

@router.delete("/turmas/{turma_id}/disciplinas")                            # Remove disciplina da turma
def remover_disciplina_turma(turma_id: int, disciplina_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    vinc = (
        db.query(TurmaDisciplina)                                             # Consulta vínculo
        .filter(and_(TurmaDisciplina.turma_id == turma_id, TurmaDisciplina.disciplina_id == disciplina_id))
        .first()
    )
    if not vinc:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    db.delete(vinc)                                                           # Remove
    db.commit()                                                               # Persiste
    return {"message": "Disciplina removida"}                              # Confirma

# ------------------------------------------------------
# Rotas CRUD de Disciplina
# ------------------------------------------------------
@router.get("/disciplinas", response_model=list[DisciplinaOut])              # Lista disciplinas
def listar_disciplinas(request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_COORD)                                         # Exige leitura ampliada
    dis = db.query(Disciplina).all()                                          # Consulta todas
    return dis                                                                # Retorna lista simples

@router.post("/disciplinas", response_model=DisciplinaOut, status_code=status.HTTP_201_CREATED)
def criar_disciplina(payload: DisciplinaCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    disc = Disciplina(**payload.dict())                                       # Cria disciplina
    db.add(disc)                                                              # Adiciona
    db.commit()                                                               # Persiste
    db.refresh(disc)                                                          # Atualiza
    return disc                                                               # Retorna disciplina criada

@router.put("/disciplinas/{disciplina_id}", response_model=DisciplinaOut)
def atualizar_disciplina(disciplina_id: int, payload: DisciplinaUpdate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    disc = db.get(Disciplina, disciplina_id)                                  # Busca disciplina
    if not disc:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    for field, value in payload.dict(exclude_unset=True).items():             # Atualiza campos
        setattr(disc, field, value)                                           # Define atributo
    db.commit()                                                               # Persiste
    db.refresh(disc)                                                          # Atualiza
    return disc                                                               # Retorna disciplina atualizada

@router.delete("/disciplinas/{disciplina_id}")                              # Remove disciplina
def remover_disciplina(disciplina_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    disc = db.get(Disciplina, disciplina_id)                                  # Busca disciplina
    if not disc:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    db.delete(disc)                                                           # Remove
    db.commit()                                                               # Persiste
    return {"message": "Disciplina removida"}

# ------------------------------------------------------
# Rotas CRUD de Professor
# ------------------------------------------------------
@router.get("/professores", response_model=list[ProfessorOut])               # Lista professores
def listar_professores(request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_COORD)                                         # Exige leitura ampliada
    profs = db.query(Professor).all()                                         # Consulta todos
    return profs                                                              # Retorna lista simples

@router.post("/professores", response_model=ProfessorOut, status_code=status.HTTP_201_CREATED)
def criar_professor(payload: ProfessorCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    prof = Professor(**payload.dict())                                       # Cria professor
    db.add(prof)                                                              # Adiciona
    db.commit()                                                               # Persiste
    db.refresh(prof)                                                          # Atualiza
    return prof                                                               # Retorna professor criado

@router.put("/professores/{professor_id}", response_model=ProfessorOut)
def atualizar_professor(professor_id: int, payload: ProfessorUpdate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    prof = db.get(Professor, professor_id)                                    # Busca professor
    if not prof:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    for field, value in payload.dict(exclude_unset=True).items():             # Atualiza campos
        setattr(prof, field, value)                                           # Define atributo
    db.commit()                                                               # Persiste
    db.refresh(prof)                                                          # Atualiza
    return prof                                                               # Retorna professor atualizado

@router.delete("/professores/{professor_id}")                              # Remove professor
def remover_professor(professor_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    prof = db.get(Professor, professor_id)                                    # Busca professor
    if not prof:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Professor não encontrado")
    db.delete(prof)                                                           # Remove
    db.commit()                                                               # Persiste
    return {"message": "Professor removido"}

# ------------------------------------------------------
# Rotas CRUD de Responsável
# ------------------------------------------------------
@router.get("/responsaveis", response_model=list[ResponsavelOut])            # Lista responsáveis
def listar_responsaveis(request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_COORD)                                         # Exige leitura ampliada
    resp = db.query(Responsavel).all()                                        # Consulta todos
    return resp                                                               # Retorna lista simples

@router.post("/responsaveis", response_model=ResponsavelOut, status_code=status.HTTP_201_CREATED)
def criar_responsavel(payload: ResponsavelCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    resp = Responsavel(**payload.dict())                                      # Cria responsável
    db.add(resp)                                                              # Adiciona
    db.commit()                                                               # Persiste
    db.refresh(resp)                                                          # Atualiza
    return resp                                                               # Retorna responsável criado

@router.put("/responsaveis/{responsavel_id}", response_model=ResponsavelOut)
def atualizar_responsavel(responsavel_id: int, payload: ResponsavelUpdate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    resp = db.get(Responsavel, responsavel_id)                                # Busca responsável
    if not resp:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Responsável não encontrado")
    for field, value in payload.dict(exclude_unset=True).items():             # Atualiza campos
        setattr(resp, field, value)                                           # Define atributo
    db.commit()                                                               # Persiste
    db.refresh(resp)                                                          # Atualiza
    return resp                                                               # Retorna responsável atualizado

@router.delete("/responsaveis/{responsavel_id}")                            # Remove responsável
def remover_responsavel(responsavel_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    resp = db.get(Responsavel, responsavel_id)                                # Busca responsável
    if not resp:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Responsável não encontrado")
    db.delete(resp)                                                           # Remove
    db.commit()                                                               # Persiste
    return {"message": "Responsável removido"}

# ------------------------------------------------------
# Rotas de vínculo aluno-responsável
# ------------------------------------------------------
@router.get("/alunos/{aluno_id}/responsaveis", response_model=list[ResponsavelOut])
def listar_responsaveis_aluno(aluno_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_COORD)                                         # Exige leitura ampliada
    registros = (
        db.query(Responsavel)                                                 # Consulta responsáveis
        .join(AlunoResponsavel, AlunoResponsavel.responsavel_id == Responsavel.id)
        .filter(AlunoResponsavel.aluno_id == aluno_id)
        .all()
    )
    return registros                                                          # Retorna lista simples

@router.post("/alunos/{aluno_id}/responsaveis", status_code=status.HTTP_201_CREATED)
def vincular_responsavel(aluno_id: int, payload: AlunoResponsavelCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    existente = (
        db.query(AlunoResponsavel)                                            # Consulta vínculo existente
        .filter(and_(AlunoResponsavel.aluno_id == aluno_id, AlunoResponsavel.responsavel_id == payload.responsavel_id))
        .first()
    )
    if existente:                                                             # Verifica duplicidade
        raise HTTPException(status_code=409, detail="Responsável já vinculado")
    vinc = AlunoResponsavel(aluno_id=aluno_id, responsavel_id=payload.responsavel_id)  # Cria vínculo
    db.add(vinc)                                                              # Adiciona
    db.commit()                                                               # Persiste
    db.refresh(vinc)                                                          # Atualiza
    return {"message": "Responsável vinculado", "data": {"id": vinc.id}}

@router.delete("/alunos/{aluno_id}/responsaveis")
def desvincular_responsavel(aluno_id: int, responsavel_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    vinc = (
        db.query(AlunoResponsavel)                                            # Consulta vínculo
        .filter(and_(AlunoResponsavel.aluno_id == aluno_id, AlunoResponsavel.responsavel_id == responsavel_id))
        .first()
    )
    if not vinc:                                                              # Verifica existência
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    db.delete(vinc)                                                           # Remove
    db.commit()                                                               # Persiste
    return {"message": "Responsável desvinculado"}


# ------------------------------------------------------
# Rotas de horários por turma
# ------------------------------------------------------
@router.get("/turmas/{turma_id}/horarios", response_model=list[HorarioOut])
def listar_horarios(turma_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, READ_COORD)                                         # Exige leitura ampliada
    horarios = db.query(Horario).filter(Horario.turma_id == turma_id).all()   # Consulta horários
    return horarios                                                           # Retorna lista simples

@router.post("/turmas/{turma_id}/horarios", response_model=HorarioOut, status_code=status.HTTP_201_CREATED)
def criar_horario(turma_id: int, payload: HorarioCreate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    # Busca professor responsável pela disciplina na turma
    td = (
        db.query(TurmaDisciplina)
        .filter(and_(TurmaDisciplina.turma_id == turma_id, TurmaDisciplina.disciplina_id == payload.disciplina_id))
        .first()
    )
    if not td:                                                                # Verifica vínculo existente
        raise HTTPException(status_code=404, detail="Disciplina não vinculada à turma")
    # Valida conflito de professor no mesmo horário
    conflito = (
        db.query(Horario)
        .join(TurmaDisciplina, TurmaDisciplina.turma_id == Horario.turma_id)
        .filter(
            TurmaDisciplina.professor_responsavel_id == td.professor_responsavel_id,
            Horario.dia_semana == payload.dia_semana,
            Horario.hora_inicio < payload.hora_fim,
            Horario.hora_fim > payload.hora_inicio,
        )
        .first()
    )
    if conflito:                                                              # Se já existe conflito
        raise HTTPException(status_code=409, detail="Conflito de horário para o professor")
    # Valida feriados pelo dia da semana (simplificado)
    feriado = (
        db.query(Feriado)
        .filter(Feriado.data.isnot(None))
        .all()
    )
    for f in feriado:                                                         # Percorre feriados
        if f.data.strftime("%a").upper().startswith(payload.dia_semana.upper()[:3]):
            raise HTTPException(status_code=409, detail="Horário coincide com feriado")
    horario = Horario(turma_id=turma_id, dia_semana=payload.dia_semana, hora_inicio=payload.hora_inicio, hora_fim=payload.hora_fim)
    db.add(horario)                                                           # Adiciona
    db.commit()                                                               # Persiste
    db.refresh(horario)                                                       # Atualiza
    return horario                                                            # Retorna horário criado

@router.put("/turmas/{turma_id}/horarios/{horario_id}", response_model=HorarioOut)
def atualizar_horario(turma_id: int, horario_id: int, payload: HorarioUpdate, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    horario = db.get(Horario, horario_id)                                     # Busca horário
    if not horario or horario.turma_id != turma_id:                           # Verifica existência e vínculo
        raise HTTPException(status_code=404, detail="Horário não encontrado")
    for field, value in payload.dict(exclude_unset=True).items():             # Atualiza campos
        setattr(horario, field, value)                                        # Define atributo
    db.commit()                                                               # Persiste
    db.refresh(horario)                                                       # Atualiza
    return horario                                                            # Retorna horário atualizado

@router.delete("/turmas/{turma_id}/horarios/{horario_id}")
def remover_horario(turma_id: int, horario_id: int, request: Request, db: Session = Depends(get_db)):
    require_role(request, FULL_ACCESS)                                        # Exige permissão total
    horario = db.get(Horario, horario_id)                                     # Busca horário
    if not horario or horario.turma_id != turma_id:                           # Verifica existência
        raise HTTPException(status_code=404, detail="Horário não encontrado")
    db.delete(horario)                                                        # Remove
    db.commit()                                                               # Persiste
    return {"message": "Horário removido"}
