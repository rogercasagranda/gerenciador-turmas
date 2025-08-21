from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from .base import Base


class LogConfig(Base):
    """Tabela de configuração de logs por tela."""

    __tablename__ = "log_config"

    id = Column(Integer, primary_key=True, autoincrement=True)
    screen = Column(Text, unique=True, nullable=False)
    create_enabled = Column(Boolean, nullable=False, default=False)
    read_enabled = Column(Boolean, nullable=False, default=False)
    update_enabled = Column(Boolean, nullable=False, default=False)
    delete_enabled = Column(Boolean, nullable=False, default=False)
    updated_by = Column(Integer, ForeignKey("usuarios.id_usuario"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    updated_by_user = relationship("Usuarios", foreign_keys=[updated_by])

    @property
    def create(self) -> bool:
        return self.create_enabled

    @create.setter
    def create(self, value: bool) -> None:
        self.create_enabled = value

    @property
    def read(self) -> bool:
        return self.read_enabled

    @read.setter
    def read(self, value: bool) -> None:
        self.read_enabled = value

    @property
    def update(self) -> bool:
        return self.update_enabled

    @update.setter
    def update(self, value: bool) -> None:
        self.update_enabled = value

    @property
    def delete(self) -> bool:
        return self.delete_enabled

    @delete.setter
    def delete(self, value: bool) -> None:
        self.delete_enabled = value
