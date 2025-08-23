import os
import sys

import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

# Define uma URL de banco temporária antes de importar os módulos
os.environ["DATABASE_URL"] = "sqlite:///./test_auth_front.db"

from frontend.app.core.database import Base, engine, SessionLocal  # noqa: E402
from frontend.app.core.security import get_password_hash  # noqa: E402
from frontend.app.models.user import User  # noqa: E402
from frontend.auth.auth_handler import verify_user  # noqa: E402


@pytest.fixture()
def db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def test_user(db):
    user = User(username="admin", hashed_password=get_password_hash("admin123"))
    db.add(user)
    db.commit()
    return user


def test_verify_user_with_correct_credentials(db, test_user):
    assert verify_user("admin", "admin123", db) is True


def test_verify_user_with_incorrect_credentials(db, test_user):
    assert verify_user("admin", "wrongpassword", db) is False
    assert verify_user("unknown", "admin123", db) is False

