"""Testa se todas as chaves estrangeiras referenciam colunas existentes."""

import importlib
import os
import pkgutil
import sys

from sqlalchemy import create_engine

# Adiciona o diretório raiz do projeto ao PYTHONPATH para permitir ``import backend``
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.models import Base  # noqa: E402  (import after path tweak)
import backend.models as models_pkg  # noqa: E402


# Garante que todos os modelos dentro de ``backend.models`` sejam importados
for _, module_name, _ in pkgutil.iter_modules(models_pkg.__path__):
    importlib.import_module(f"{models_pkg.__name__}.{module_name}")


def test_foreign_keys_target_columns_exist():
    """Cria todas as tabelas em memória e valida as FKs."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    metadata = Base.metadata
    for table in metadata.tables.values():
        for fk in table.foreign_keys:
            target_table = fk.column.table.name
            target_column = fk.column.name
            assert (
                target_table in metadata.tables
            ), f"Tabela alvo '{target_table}' inexistente para FK em '{table.name}'"
            assert (
                target_column in metadata.tables[target_table].columns
            ), f"Coluna alvo '{target_table}.{target_column}' inexistente para FK em '{table.name}'"

