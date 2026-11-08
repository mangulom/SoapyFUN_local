"""Initialize SoapyFUN auth schema and optional first administrator.

Usage from backend/: python init_db.py
Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_NAME in the local environment first.
Password is hashed with Argon2 before it is stored. No credentials are printed.
"""

import os
import sys
from pathlib import Path

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent))

from app.db import SessionLocal, engine  # noqa: E402
from app.models import Base, Role, User  # noqa: E402
from app.security import hash_password  # noqa: E402
from app.settings import settings  # noqa: E402


def main() -> None:
    Base.metadata.create_all(bind=engine)
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not settings.secret_key:
        raise SystemExit("Set SECRET_KEY in the local environment before initializing SoapyFUN.")
    name = os.environ.get("ADMIN_NAME", "Rocío Nuñez Kikushima").strip()
    if not email and not password:
        print("SoapyFUN database schema ready. No admin user requested.")
        return
    if not email or len(password) < 12:
        raise SystemExit("Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) before creating admin.")

    with SessionLocal.begin() as db:
        role = db.scalar(select(Role).where(Role.name == "admin"))
        if role is None:
            role = Role(name="admin")
            db.add(role)
            db.flush()
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            db.add(User(email=email, password_hash=hash_password(password), full_name=name, role_id=role.id))
            print("SoapyFUN administrator created; password stored as an Argon2 hash.")
        else:
            print("SoapyFUN administrator already exists; no changes made.")


if __name__ == "__main__":
    main()
