from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models import Role, User
from app.security import hash_password, verify_password


def test_argon2_hash_verifies_without_storing_plaintext() -> None:
    password = "SoapyFUN-test-2026!"
    hashed = hash_password(password)
    assert password not in hashed
    assert hashed.startswith("$argon2")
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)


def test_local_database_login_and_me_roundtrip() -> None:
    with SessionLocal.begin() as db:
        role = db.query(Role).filter_by(name="auth-test").one_or_none()
        if role is None:
            role = Role(name="auth-test")
            db.add(role)
            db.flush()
        user = db.query(User).filter_by(email="auth-test@soapyfun.local").one_or_none()
        if user is None:
            user = User(email="auth-test@soapyfun.local", password_hash=hash_password("AuthTest2026!"), full_name="Auth Test", role_id=role.id)
            db.add(user)
        db.flush()
        user_id = user.id

    client = TestClient(app)
    login = client.post("/api/auth/login", json={"email": "auth-test@soapyfun.local", "password": "AuthTest2026!"})
    assert login.status_code == 200
    profile = client.get("/api/auth/me", headers={"Authorization": f"Bearer {login.json()['access_token']}"})
    assert profile.status_code == 200
    assert profile.json()["id"] == user_id
