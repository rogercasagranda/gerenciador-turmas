# backend/models/__init__.py

# Exporta Base e modelos
from .base import Base  # noqa: F401
from .ano_letivo import AnoLetivo  # noqa: F401
from .turno import Turno  # noqa: F401
from .turma import Turma  # noqa: F401
from .horario import Horario  # noqa: F401
from .disciplina import Disciplina  # noqa: F401
from .turma_disciplina import TurmaDisciplina  # noqa: F401
from .professor import Professor  # noqa: F401
from .aluno import Aluno  # noqa: F401
from .responsavel import Responsavel  # noqa: F401
from .aluno_responsavel import AlunoResponsavel  # noqa: F401
from .turma_aluno import TurmaAluno  # noqa: F401
from .feriado import Feriado  # noqa: F401
from .usuarios import Usuarios  # noqa: F401
from .logconfig import LogConfig  # noqa: F401
from .logauditoria import LogAuditoria  # noqa: F401
from .tela import Tela  # noqa: F401
from .permissoes import (
    Grupo,
    UsuarioGrupo,
    GrupoPermissao,
    UsuarioPermissaoTemp,
    PerfilWhitelist,
    PermissaoStatus,
    PerfilEnum,
)  # noqa: F401
