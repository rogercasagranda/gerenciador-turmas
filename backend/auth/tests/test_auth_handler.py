import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from auth_handler import verify_user


def test_verify_user_with_correct_credentials():
    assert verify_user("admin", "admin123") is True


def test_verify_user_with_incorrect_credentials():
    assert verify_user("admin", "wrongpassword") is False
    assert verify_user("unknown", "admin123") is False
