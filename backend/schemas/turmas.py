# backend/schemas/turmas.py
# ======================================================
# Schemas Pydantic para o módulo de Turmas
# Cada linha contém um comentário explicativo
# ======================================================
from datetime import date, time                                   # Importa tipos de data e hora
from pydantic import BaseModel, Field                              # Importa BaseModel e utilidades do Pydantic
from typing import Optional                                       # Importa Optional para campos opcionais

# ------------------------------------------------------
# Schemas para Ano Letivo com período único
# ------------------------------------------------------
class AnoLetivoBase(BaseModel):                                   # Classe base com campos comuns

    descricao: str = Field(..., min_length=3, description="Descrição do ano letivo")  # Descrição textual
    inicio: date = Field(..., description="Data inicial do período")                  # Data de início
    fim: date = Field(..., description="Data final do período")                      # Data de término





class AnoLetivoCreate(AnoLetivoBase):                             # Schema para criação
    pass                                                          # Nenhum campo adicional



class AnoLetivoUpdate(BaseModel):                                 # Schema para atualização
    descricao: Optional[str] = Field(None, min_length=3, description="Descrição do ano letivo")  # Descrição opcional
    inicio: Optional[date] = Field(None, description="Data inicial do período")                  # Data inicial opcional
    fim: Optional[date] = Field(None, description="Data final do período")                      # Data final opcional

class AnoLetivoOut(AnoLetivoBase):                                # Schema de resposta
    id: int                                                       # Identificador do ano letivo

    model_config = {"from_attributes": True}                     # Permite criação a partir do ORM


# ------------------------------------------------------
# Schemas para Turno
# ------------------------------------------------------
class TurnoOut(BaseModel):                                        # Schema de saída para turno
    id: int                                                       # Identificador do turno
    nome: str                                                     # Nome do turno
    class Config:                                                 # Configurações Pydantic
        from_attributes = True                                    # Permite uso com ORM

# ------------------------------------------------------
# Schemas para Turma
# ------------------------------------------------------
class TurmaBase(BaseModel):                                       # Campos comuns de turma
    nome: str = Field(..., description="Nome da turma")                       # Nome descritivo
    ano_letivo_id: int = Field(..., description="ID do ano letivo")           # Relacionamento com ano letivo
    turno_id: int = Field(..., description="ID do turno")                     # Relacionamento com turno
    coordenador_id: Optional[int] = Field(None, description="ID do coordenador")  # Coordenador opcional

class TurmaCreate(TurmaBase):                                     # Schema de criação de turma
    pass                                                          # Nenhum campo adicional

class TurmaUpdate(BaseModel):                                     # Schema de atualização de turma
    nome: Optional[str] = None                                    # Nome opcional
    ano_letivo_id: Optional[int] = None                           # Ano letivo opcional
    turno_id: Optional[int] = None                                # Turno opcional
    coordenador_id: Optional[int] = None                          # Coordenador opcional

class TurmaOut(TurmaBase):                                        # Schema de saída de turma
    id: int                                                       # Identificador da turma
    class Config:                                                 # Configurações Pydantic
        from_attributes = True                                    # Permite uso com ORM

# ------------------------------------------------------
# Schemas para vínculo Turma-Aluno
# ------------------------------------------------------
class TurmaAlunoCreate(BaseModel):                                # Payload para adicionar aluno
    aluno_id: int = Field(..., description="ID do aluno")                     # Identificador do aluno
    dt_matricula: date = Field(..., description="Data da matrícula")          # Data da matrícula

class AlunoOut(BaseModel):                                        # Representação de aluno
    id: int                                                       # ID do aluno
    user_id: int                                                  # ID do usuário associado
    ra: Optional[str] = None                                      # Registro acadêmico opcional
    class Config:                                                 # Configurações Pydantic
        from_attributes = True                                    # Permite criação a partir do ORM

# ------------------------------------------------------
# Schema para vínculo Turma-Disciplina
# ------------------------------------------------------
class TurmaDisciplinaCreate(BaseModel):                           # Payload para adicionar disciplina
    disciplina_id: int = Field(..., description="ID da disciplina")           # Identificador da disciplina
    professor_id: int = Field(..., description="ID do professor")             # Identificador do professor

# ------------------------------------------------------
# Schemas para Disciplinas e Professores
# ------------------------------------------------------
class DisciplinaBase(BaseModel):                                  # Campos comuns da disciplina
    nome: str = Field(..., description="Nome da disciplina")                 # Nome
    carga_horaria: int = Field(..., description="Carga horária")             # Carga horária

class DisciplinaCreate(DisciplinaBase):                           # Schema de criação de disciplina
    pass                                                          # Sem campos extras

class DisciplinaUpdate(BaseModel):                                # Schema de atualização
    nome: Optional[str] = None                                    # Nome opcional
    carga_horaria: Optional[int] = None                           # Carga horária opcional

class DisciplinaOut(DisciplinaBase):                              # Resposta da disciplina
    id: int                                                       # Identificador
    class Config:                                                 # Configurações
        from_attributes = True                                    # Usa ORM

class ProfessorBase(BaseModel):                                   # Campos comuns de professor
    user_id: int = Field(..., description="ID do usuário")                   # Relacionamento com usuário
    area_atuacao: Optional[str] = Field(None, description="Área de atuação") # Área de atuação

class ProfessorCreate(ProfessorBase):                             # Schema para criação
    pass                                                          # Sem campos extras

class ProfessorUpdate(BaseModel):                                 # Schema de atualização
    user_id: Optional[int] = None                                 # Usuário opcional
    area_atuacao: Optional[str] = None                            # Área opcional

class ProfessorOut(ProfessorBase):                                # Resposta de professor
    id: int                                                       # Identificador
    class Config:                                                 # Configurações
        from_attributes = True                                    # Usa ORM

# ------------------------------------------------------
# Schemas para Responsável e vínculo aluno-responsável
# ------------------------------------------------------
class ResponsavelBase(BaseModel):                                 # Campos comuns do responsável
    user_id: int = Field(..., description="ID do usuário")                   # Relacionamento
    parentesco: Optional[str] = Field(None, description="Parentesco")        # Grau de parentesco

class ResponsavelCreate(ResponsavelBase):                         # Schema de criação
    pass                                                          # Sem campos extras

class ResponsavelUpdate(BaseModel):                               # Schema de atualização
    user_id: Optional[int] = None                                 # Usuário opcional
    parentesco: Optional[str] = None                              # Parentesco opcional

class ResponsavelOut(ResponsavelBase):                            # Resposta do responsável
    id: int                                                       # Identificador
    class Config:                                                 # Configurações
        from_attributes = True                                    # Usa ORM

class AlunoResponsavelCreate(BaseModel):                          # Payload para vincular responsável
    responsavel_id: int = Field(..., description="ID do responsável")        # ID do responsável

# ------------------------------------------------------
# Schemas para Horário e Feriado
# ------------------------------------------------------
class HorarioBase(BaseModel):                                     # Campos comuns de horário
    dia_semana: str = Field(..., description="Dia da semana")                # Dia da semana
    hora_inicio: time = Field(..., description="Hora inicial")               # Hora de início
    hora_fim: time = Field(..., description="Hora final")                    # Hora de término

class HorarioCreate(HorarioBase):                                 # Payload para criar horário
    disciplina_id: int = Field(..., description="ID da disciplina")         # Disciplina associada

class HorarioUpdate(BaseModel):                                   # Atualização de horário
    dia_semana: Optional[str] = None                              # Dia opcional
    hora_inicio: Optional[time] = None                            # Hora inicial opcional
    hora_fim: Optional[time] = None                               # Hora final opcional

class HorarioOut(HorarioBase):                                    # Resposta de horário
    id: int                                                       # Identificador
    class Config:                                                 # Configurações
        from_attributes = True                                    # Usa ORM

class FeriadoBase(BaseModel):                                     # Campos do feriado
    ano_letivo_id: int = Field(..., description="ID do ano letivo")          # Referência ao ano letivo
    data: date = Field(..., description="Data do feriado")                    # Data do feriado
    descricao: str = Field(..., description="Descrição")                     # Descrição
    origem: str = Field(..., description="Origem do feriado")                # Origem

class FeriadoCreate(FeriadoBase):                                 # Criação de feriado
    pass                                                          # Sem campos extras

class FeriadoUpdate(BaseModel):                                   # Atualização de feriado
    data: Optional[date] = None                                   # Data opcional
    descricao: Optional[str] = None                               # Descrição opcional
    origem: Optional[str] = None                                  # Origem opcional

class FeriadoOut(FeriadoBase):                                    # Resposta de feriado
    id: int                                                       # Identificador
    class Config:                                                 # Configurações
        from_attributes = True                                    # Usa ORM

class FeriadoImportarNacionais(BaseModel):                        # Payload para importar nacionais
    ano_letivo_id: int = Field(..., description="ID do ano letivo")  # Referência ao ano letivo
    anos: list[int] = Field(..., description="Lista de anos a importar")  # Anos a consultar
