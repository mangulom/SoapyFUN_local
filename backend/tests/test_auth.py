from fastapi.testclient import TestClient

from app.db import SessionLocal, engine
from app.main import app
from app.models import Company, Role, User
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


def test_company_endpoints_are_admin_only_and_tenant_scoped():
    with SessionLocal.begin() as db:
        company = db.query(Company).filter_by(name="tenant-test").one_or_none()
        if company is None:
            company = Company(name="tenant-test", is_active=True)
            db.add(company)
            db.flush()
        role = db.query(Role).filter_by(name="tenant-test-member").one_or_none()
        if role is None:
            role = Role(name="tenant-test-member")
            db.add(role)
            db.flush()
        user = db.query(User).filter_by(email="tenant-member@soapyfun.local").one_or_none()
        if user is None:
            user = User(email="tenant-member@soapyfun.local", password_hash=hash_password("TenantTest2026!"), full_name="Tenant Member", role_id=role.id, company_id=company.id)
            db.add(user)
        user.company_id = company.id
        company_id = company.id
        user.company_id = company.id
        db.flush()
    client = TestClient(app)
    login = client.post("/api/auth/login", json={"email": "tenant-member@soapyfun.local", "password": "TenantTest2026!"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    assert [row["name"] for row in client.get("/api/empresas", headers=headers).json()] == ["tenant-test"]
    assert client.post("/api/empresas", headers=headers, json={"name": "no-access"}).status_code == 403
    assert client.get("/api/productos", headers=headers).status_code == 200
    assert client.get(f"/api/productos?empresa_id={company_id + 10000}", headers=headers).json() == []


def test_recipe_shelf_life_fields_and_tax_id_validation():
    import pytest
    from pydantic import ValidationError
    from app.main import CompanySchema, RecipeSchema
    with pytest.raises(ValidationError):
        CompanySchema(name="Invalid", ruc="123")
    recipe = RecipeSchema(code="R-TEST", name="Test", cure_time_days=35, shelf_life_days=400)
    assert recipe.cure_time_days == 35
    assert recipe.shelf_life_days == 400


def test_company_crud_requires_global_admin_and_validates_data():
    import pytest
    from pydantic import ValidationError
    from app.main import CompanySchema
    from app.models import Company, Role, User

    with pytest.raises(ValidationError):
        CompanySchema(name="", ruc="123")

    with SessionLocal.begin() as db:
        admin_role = db.query(Role).filter_by(name="admin").one_or_none()
        if admin_role is None:
            admin_role = Role(name="admin")
            db.add(admin_role)
            db.flush()
        member_role = db.query(Role).filter_by(name="company-crud-member").one_or_none()
        if member_role is None:
            member_role = Role(name="company-crud-member")
            db.add(member_role)
            db.flush()
        admin = db.query(User).filter_by(email="company-crud-admin@soapyfun.local").one_or_none()
        if admin is None:
            admin = User(email="company-crud-admin@soapyfun.local", password_hash=hash_password("CompanyCrudAdmin2026!"), full_name="Company CRUD Admin", role_id=admin_role.id)
            db.add(admin)
        else:
            admin.role_id = admin_role.id
        company = db.query(Company).filter_by(name="company-crud-target").one_or_none()
        if company is None:
            company = Company(name="company-crud-target", ruc="20987654321", is_active=True)
            db.add(company)
            db.flush()
        member = db.query(User).filter_by(email="company-crud-member@soapyfun.local").one_or_none()
        if member is None:
            member = User(email="company-crud-member@soapyfun.local", password_hash=hash_password("CompanyCrudMember2026!"), full_name="Company CRUD Member", role_id=member_role.id, company_id=company.id)
            db.add(member)
        else:
            member.role_id = member_role.id
            member.company_id = company.id
        target_id = company.id

    client = TestClient(app)
    admin_login = client.post("/api/auth/login", json={"email": "company-crud-admin@soapyfun.local", "password": "CompanyCrudAdmin2026!"})
    member_login = client.post("/api/auth/login", json={"email": "company-crud-member@soapyfun.local", "password": "CompanyCrudMember2026!"})
    assert admin_login.status_code == member_login.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    member_headers = {"Authorization": f"Bearer {member_login.json()['access_token']}"}

    listed = client.get("/api/empresas", headers=admin_headers)
    assert listed.status_code == 200
    assert any(company["name"] == "KIKURELA" for company in listed.json())
    detail = client.get(f"/api/empresas/{target_id}", headers=admin_headers)
    assert detail.status_code == 200
    assert detail.json()["ruc"] == "20987654321"
    assert client.get(f"/api/empresas/{target_id + 100000}", headers=admin_headers).status_code == 404
    assert client.get("/api/empresas", headers=member_headers).json()[0]["id"] == target_id
    assert client.post("/api/empresas", headers=member_headers, json={"name": "Forbidden"}).status_code == 403
    assert client.patch(f"/api/usuarios/{member_login.json()['usuario']['id']}/empresa", headers=member_headers, json={"company_id": company_id + 1}).status_code == 403
    changed_company = client.patch(f"/api/usuarios/{member_login.json()['usuario']['id']}/empresa", headers=admin_headers, json={"company_id": company_id})
    assert changed_company.status_code == 200
    assert changed_company.json()["company_id"] == company_id

    created = client.post("/api/empresas", headers=admin_headers, json={"name": "Company CRUD Created", "dni": "12345678"})
    assert created.status_code == 201
    created_id = created.json()["id"]
    assert created.json()["dni"] == "12345678"
    updated = client.put(f"/api/empresas/{created_id}", headers=admin_headers, json={"name": "Company CRUD Updated", "is_active": False})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Company CRUD Updated"
    assert updated.json()["is_active"] is False
    duplicate_ruc = client.post("/api/empresas", headers=admin_headers, json={"name": "Duplicate", "ruc": "20987654321"})
    assert duplicate_ruc.status_code == 409
    assert client.delete(f"/api/empresas/{target_id}", headers=admin_headers).status_code == 409
    assert client.delete(f"/api/empresas/{created_id}", headers=admin_headers).status_code == 204
    assert client.delete(f"/api/empresas/{created_id}", headers=admin_headers).status_code == 404


def test_recipe_cure_units_normalize_to_minutes():
    from app.main import RecipeSchema
    assert RecipeSchema(code="C-MIN", name="Minutes", cure_time_value=90, cure_time_unit="minutes").normalized_cure_minutes() == 90
    assert RecipeSchema(code="C-HR", name="Hours", cure_time_value=2.5, cure_time_unit="hours").normalized_cure_minutes() == 150
    assert RecipeSchema(code="C-DAY", name="Days", cure_time_value=3, cure_time_unit="days").normalized_cure_minutes() == 4320


def test_production_and_expiry_are_based_on_cure_ready_date():
    from app.db import SessionLocal
    from app.main import app
    from app.models import Company, Role, User

    with SessionLocal.begin() as db:
        company = db.query(Company).filter_by(name="cure-date-test").one_or_none()
        if company is None:
            company = Company(name="cure-date-test", is_active=True)
            db.add(company)
            db.flush()
        role = db.query(Role).filter_by(name="cure-date-member").one_or_none()
        if role is None:
            role = Role(name="cure-date-member")
            db.add(role)
            db.flush()
        user = db.query(User).filter_by(email="cure-date@soapyfun.local").one_or_none()
        if user is None:
            user = User(email="cure-date@soapyfun.local", password_hash=hash_password("CureDateTest2026!"), full_name="Cure Date", role_id=role.id, company_id=company.id)
            db.add(user)
        user.company_id = company.id
        company_id = company.id

    client = TestClient(app)
    login = client.post("/api/auth/login", json={"email": "cure-date@soapyfun.local", "password": "CureDateTest2026!"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    existing = client.get("/api/recetas", headers=headers).json()
    existing_recipe = next((recipe for recipe in existing if recipe["code"] == "CURE-DATE-TEST"), None)
    recipe_payload = {
        "code": "CURE-DATE-TEST", "name": "Cure date formula", "method": "Proceso en fr?o",
        "batch_grams": 1000, "estimated_bars": 10, "cost_per_bar": 2, "total_batch_cost": 20,
        "superfat_pct": 8, "lye_concentration_pct": 30, "version": "v1", "status": "Activa",
        "cure_time_value": 90, "cure_time_unit": "minutes", "shelf_life_days": 30, "company_id": company_id
    }
    if existing_recipe:
        recipe_response = client.put(f"/api/recetas/{existing_recipe['id']}", headers=headers, json=recipe_payload)
    else:
        recipe_response = client.post("/api/recetas", headers=headers, json=recipe_payload)
    assert recipe_response.status_code in (200, 201)
    recipe = recipe_response.json()
    recipe_id = recipe.get("id") or recipe["recipe"]["id"]
    product_response = client.post("/api/productos/producir", headers=headers, json={
        "recipe_id": recipe_id, "quantity": 1, "manufacture_date": "2026-03-01"
    })
    assert product_response.status_code == 201
    result = product_response.json()
    assert result["product"]["manufacture_date"] == "2026-03-02"
    assert result["product"]["expiry_date"] == "2026-04-01"
    assert result["cure_time_minutes"] == 90
