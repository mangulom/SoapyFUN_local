from datetime import date, timedelta
from typing import Optional
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select, text, func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import engine, get_db
from app.models import (
    Base,
    Company,
    Customer,
    Ingredient,
    Invoice,
    Order,
    Product,
    Purchase,
    Recipe,
    Role,
    Supplier,
    User,
)
from app.security import create_access_token, verify_password
from app.settings import settings

app = FastAPI(
    title="SoapyFUN API",
    description="API de gestion de jaboneria artesanal: inventario, compras y ventas.",
    version="0.1.0",
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={"example": {"email": "admin@soapyfun.local", "password": "..."}}
    )
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Enter a valid email address")
        return normalized


class UserResponse(BaseModel):
    id: int
    email: str
    nombre: str
    rol: str
    company_id: Optional[int] = None
    company_name: Optional[str] = None


class UserCompanyUpdate(BaseModel):
    company_id: Optional[int] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UserResponse


# Schemas Pydantic para Entidades CRUD
class ProductSchema(BaseModel):
    code: str
    name: str
    category: str
    presentation: str = "Barra 100 g"
    price: float
    cost: float = 0.0
    stock: int = 0
    min_stock: int = 5
    status: str = "Publicado"
    scent: Optional[str] = None
    benefits: Optional[str] = None
    icon: Optional[str] = "🧼"
    tone: Optional[str] = "lavender"
    recipe_id: Optional[int] = None
    manufacture_date: Optional[date] = None
    company_id: Optional[int] = None


class RecipeSchema(BaseModel):
    code: str
    name: str
    method: str = "Proceso en frío"
    batch_grams: float = 1000.0
    estimated_bars: int = 10
    cost_per_bar: float = 0.0
    total_batch_cost: float = 0.0
    superfat_pct: float = 8.0
    lye_concentration_pct: float = 30.0
    version: str = "v1"
    status: str = "Activa"
    safety_notes: Optional[str] = None
    cure_time_value: float = Field(default=42, ge=0, le=525600)
    cure_time_unit: str = "days"
    cure_time_minutes: Optional[int] = Field(default=None, ge=0, le=5256000)
    cure_time_days: Optional[int] = Field(default=None, ge=0, le=3650)  # legacy API compatibility
    shelf_life_days: int = Field(default=365, ge=1, le=3650)
    company_id: Optional[int] = None

    @field_validator("cure_time_unit")
    @classmethod
    def validate_cure_unit(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"minutes", "hours", "days"}:
            raise ValueError("La unidad de curetaje debe ser minutes, hours o days")
        return normalized

    def normalized_cure_minutes(self) -> int:
        if self.cure_time_minutes is not None:
            return self.cure_time_minutes
        if self.cure_time_days is not None:
            return self.cure_time_days * 1440
        factor = {"minutes": 1, "hours": 60, "days": 1440}[self.cure_time_unit]
        return int(round(self.cure_time_value * factor))


class CompanySchema(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=160)
    ruc: Optional[str] = None
    dni: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True

    @field_validator("ruc", "dni", "address", "phone", "email", mode="before")
    @classmethod
    def normalize_optional_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("ruc")
    @classmethod
    def validate_ruc(cls, value: Optional[str]) -> Optional[str]:
        if value and (len(value) != 11 or not value.isdigit()):
            raise ValueError("El RUC debe contener 11 d\u00edgitos")
        return value

    @field_validator("dni")
    @classmethod
    def validate_dni(cls, value: Optional[str]) -> Optional[str]:
        if value and (len(value) != 8 or not value.isdigit()):
            raise ValueError("El DNI debe contener 8 d\u00edgitos")
        return value


class IngredientSchema(BaseModel):
    code: str
    name: str
    group_name: str
    stock: float = 0.0
    unit: str = "kg"
    min_stock: float = 1.0
    unit_cost: float = 0.0
    supplier_name: str
    brand: Optional[str] = None


class PurchaseSchema(BaseModel):
    code: str
    purchase_date: str
    supplier_name: str
    ingredient_name: str
    quantity: float
    unit: str
    unit_cost: float
    total: float
    invoice_number: Optional[str] = None
    status: str = "Recibida"
    notes: Optional[str] = None


class SupplierSchema(BaseModel):
    code: str
    name: str
    category: str
    contact_person: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = "Lima"
    rating: int = 5
    is_active: bool = True


class OrderSchema(BaseModel):
    code: str
    customer_name: str
    channel: str = "Tienda web"
    payment_method: str = "Yape / Plin"
    items_summary: str
    total: float
    status: str = "Por preparar"
    delivery_address: Optional[str] = None
    notes: Optional[str] = None


class CustomerSchema(BaseModel):
    code: str
    name: str
    email: str
    phone: str
    segment: str = "Nueva"
    city: Optional[str] = "Lima"
    notes: Optional[str] = None


class InvoiceSchema(BaseModel):
    invoice_number: str
    invoice_type: str = "Borrador comercial"
    customer_name: str
    customer_doc: str
    issue_date: str
    due_date: str
    subtotal: float
    tax: float
    total: float
    status: str = "Pendiente"
    concept: str


@app.middleware("http")
async def development_cors_for_local_frontend(request, call_next):
    """Allow local Angular development origins without exposing DB configuration."""
    origin = request.headers.get("origin", "")
    allowed_origin = origin if origin in settings.allowed_origins() else None
    if settings.app_env == "development" and origin in {
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    }:
        allowed_origin = origin

    if request.method == "OPTIONS" and allowed_origin:
        from starlette.responses import Response

        response = Response(status_code=204)
        response.headers["Access-Control-Allow-Origin"] = allowed_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = request.headers.get(
            "access-control-request-headers", "Authorization, Content-Type"
        )
        response.headers["Access-Control-Max-Age"] = "600"
        response.headers["Vary"] = "Origin"
        return response

    response = await call_next(request)
    if allowed_origin:
        response.headers["Access-Control-Allow-Origin"] = allowed_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"
    return response


@app.on_event("startup")
def migrate_tenant_and_shelf_life_columns() -> None:
    """Additive migration for existing installations; new databases use SQLAlchemy metadata."""
    from sqlalchemy import inspect
    try:
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        if "companies" not in tables:
            return
        additions = {
            "users": {"company_id": "INTEGER REFERENCES companies(id)"},
            "products": {"manufacture_date": "DATE", "expiry_date": "DATE", "shelf_life_days": "INTEGER NOT NULL DEFAULT 365", "recipe_id": "INTEGER REFERENCES recipes(id)", "company_id": "INTEGER REFERENCES companies(id)"},
            "recipes": {"cure_time_minutes": "INTEGER NOT NULL DEFAULT 10080", "shelf_life_days": "INTEGER NOT NULL DEFAULT 365", "company_id": "INTEGER REFERENCES companies(id)"},
            "ingredients": {"company_id": "INTEGER REFERENCES companies(id)"},
            "purchases": {"company_id": "INTEGER REFERENCES companies(id)"},
            "suppliers": {"company_id": "INTEGER REFERENCES companies(id)"},
            "orders": {"company_id": "INTEGER REFERENCES companies(id)"},
            "customers": {"company_id": "INTEGER REFERENCES companies(id)"},
            "invoices": {"company_id": "INTEGER REFERENCES companies(id)"},
        }
        with engine.begin() as connection:
            for table, columns in additions.items():
                if table not in tables:
                    continue
                existing = {column["name"] for column in inspector.get_columns(table)}
                for column, definition in columns.items():
                    if column not in existing:
                        connection.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {definition}'))
            if "recipes" in tables:
                recipe_columns = {column["name"] for column in inspector.get_columns("recipes")}
                if "cure_time_days" in recipe_columns:
                    connection.execute(text("UPDATE recipes SET cure_time_minutes = cure_time_days * 1440 WHERE cure_time_minutes = 10080 AND cure_time_days IS NOT NULL"))
            company = connection.execute(text("SELECT id FROM companies WHERE name = 'KIKURELA' LIMIT 1")).first()
            if company is None:
                result = connection.execute(text("INSERT INTO companies (name, is_active) VALUES ('KIKURELA', TRUE) RETURNING id"))
                company_id = result.scalar_one()
            else:
                company_id = company[0]
            for table in ("users", "products", "recipes", "ingredients", "purchases", "suppliers", "orders", "customers", "invoices"):
                if table in tables:
                    connection.execute(text(f'UPDATE "{table}" SET company_id = :company_id WHERE company_id IS NULL'), {"company_id": company_id})
    except SQLAlchemyError:
        # Readiness endpoint reports database problems; don't prevent health checks from starting.
        return


@app.get("/api/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "application": "SoapyFUN API", "version": app.version}


@app.get("/health", tags=["system"], include_in_schema=False)
def short_health() -> dict[str, str]:
    return health()


@app.post("/api/auth/login", tags=["auth"], response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user is None or not user.is_active or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    role = db.get(Role, user.role_id)
    if user.company_id is None and not is_global_admin(user, db):
        raise HTTPException(status_code=403, detail="Usuario sin empresa asignada")
    company = db.get(Company, user.company_id) if user.company_id else None
    if company is not None and not company.is_active:
        raise HTTPException(status_code=403, detail="La empresa asignada est\u00e1 inactiva")
    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        usuario=UserResponse(id=user.id, email=user.email, nombre=user.full_name, rol=role.name if role else "user", company_id=user.company_id, company_name=company.name if company else None),
    )


@app.get("/api/auth/me", tags=["auth"], response_model=UserResponse)
def current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserResponse:
    import jwt
    try:
        claims = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user = db.get(User, int(claims["sub"]))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión inválida") from exc
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no disponible")
    role = db.get(Role, user.role_id)
    company = db.get(Company, user.company_id) if user.company_id else None
    return UserResponse(id=user.id, email=user.email, nombre=user.full_name, rol=role.name if role else "user", company_id=user.company_id, company_name=company.name if company else None)


@app.get("/api/health/ready", tags=["system"])
def readiness() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return {"status": "degraded", "database": "unavailable"}
    return {"status": "ok", "database": "available"}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    import jwt
    try:
        claims = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user = db.get(User, int(claims["sub"]))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Sesión inválida") from exc
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no disponible")
    return user


def is_global_admin(user: User, db: Session) -> bool:
    role = db.get(Role, user.role_id)
    return bool(role and role.name.strip().lower() in {"admin", "superadmin"})


def scoped_query(model, user: User, db: Session, company_id: Optional[int] = None):
    query = select(model).order_by(model.id.desc())
    if is_global_admin(user, db) and company_id is not None:
        query = query.where(model.company_id == company_id)
    if not is_global_admin(user, db):
        if user.company_id is None:
            raise HTTPException(status_code=403, detail="Usuario sin empresa asignada")
        query = query.where(model.company_id == user.company_id)
    return query


def create_scoped(item, model, user: User, db: Session, **overrides):
    target_company = overrides.pop("company_id", None)
    transient_recipe_fields = {"company_id", "cure_time_value", "cure_time_unit", "cure_time_days", "cure_time_minutes"}
    if isinstance(item, ProductSchema):
        values = item.model_dump(exclude={"manufacture_date", "company_id"})
    elif isinstance(item, RecipeSchema):
        values = item.model_dump(exclude=transient_recipe_fields)
    else:
        values = item.model_dump(exclude={"company_id"})
    values.update(overrides)
    if hasattr(model, "company_id"):
        company_id = user.company_id if user.company_id is not None else target_company
        if company_id is None:
            raise HTTPException(status_code=422, detail="Seleccione una empresa para continuar")
        if db.get(Company, company_id) is None:
            raise HTTPException(status_code=422, detail="Empresa no encontrada")
        values["company_id"] = company_id
    obj = model(**values)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def ensure_company_admin(user: User, db: Session) -> None:
    if not is_global_admin(user, db):
        raise HTTPException(status_code=403, detail="Solo un administrador global puede gestionar empresas")


def ensure_unique_company_ids(item: CompanySchema, db: Session, exclude_id: Optional[int] = None) -> None:
    if item.ruc:
        query = select(Company.id).where(Company.ruc == item.ruc)
        if exclude_id is not None:
            query = query.where(Company.id != exclude_id)
        if db.scalar(query.limit(1)):
            raise HTTPException(status_code=409, detail="Ya existe una empresa con ese RUC")


@app.get("/api/empresas", tags=["empresas"])
def listar_empresas(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = select(Company).order_by(Company.name.asc(), Company.id.asc())
    if not is_global_admin(user, db):
        if user.company_id is None:
            raise HTTPException(status_code=403, detail="Usuario sin empresa asignada")
        query = query.where(Company.id == user.company_id)
    return db.scalars(query).all()


@app.patch("/api/usuarios/{item_id}/empresa", tags=["usuarios"])
def actualizar_empresa_usuario(
    item_id: int,
    item: UserCompanyUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_company_admin(user, db)
    target_user = db.get(User, item_id)
    if target_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if item.company_id is not None:
        company = db.get(Company, item.company_id)
        if company is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if not company.is_active:
            raise HTTPException(status_code=422, detail="No se puede asignar un usuario a una empresa inactiva")
    target_user.company_id = item.company_id
    db.commit()
    db.refresh(target_user)
    company = db.get(Company, target_user.company_id) if target_user.company_id else None
    role = db.get(Role, target_user.role_id)
    return UserResponse(
        id=target_user.id,
        email=target_user.email,
        nombre=target_user.full_name,
        rol=role.name if role else "user",
        company_id=target_user.company_id,
        company_name=company.name if company else None,
    )


@app.get("/api/empresas/{item_id}", tags=["empresas"])
def obtener_empresa(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if is_global_admin(user, db):
        company = db.get(Company, item_id)
    else:
        company = db.scalar(select(Company).where(Company.id == item_id, Company.id == user.company_id))
    if company is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return company


@app.post("/api/empresas", tags=["empresas"], status_code=status.HTTP_201_CREATED)
def crear_empresa(item: CompanySchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_company_admin(user, db)
    ensure_unique_company_ids(item, db)
    company = Company(**item.model_dump())
    db.add(company)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="El RUC ya pertenece a otra empresa") from exc
    db.refresh(company)
    return company


@app.put("/api/empresas/{item_id}", tags=["empresas"])
def actualizar_empresa(item_id: int, item: CompanySchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_company_admin(user, db)
    company = db.get(Company, item_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    ensure_unique_company_ids(item, db, exclude_id=item_id)
    for key, value in item.model_dump().items():
        setattr(company, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="El RUC ya pertenece a otra empresa") from exc
    db.refresh(company)
    return company


@app.delete("/api/empresas/{item_id}", tags=["empresas"], status_code=status.HTTP_204_NO_CONTENT)
def eliminar_empresa(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_company_admin(user, db)
    company = db.get(Company, item_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if db.scalar(select(User.id).where(User.company_id == item_id).limit(1)):
        raise HTTPException(status_code=409, detail="No se puede eliminar una empresa con usuarios asignados")
    linked_models = (Product, Recipe, Ingredient, Purchase, Supplier, Order, Customer, Invoice)
    for model in linked_models:
        if db.scalar(select(model.id).where(model.company_id == item_id).limit(1)):
            raise HTTPException(status_code=409, detail="No se puede eliminar una empresa con registros asociados")
    db.delete(company)
    db.commit()
    return None


@app.post("/api/productos/producir", tags=["productos"], status_code=status.HTTP_201_CREATED)
def producir_lote(payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recipe_id = payload.get("recipe_id")
    quantity = payload.get("quantity", 1)
    manufacture_date = payload.get("manufacture_date") or date.today()
    if isinstance(manufacture_date, str):
        try:
            manufacture_date = date.fromisoformat(manufacture_date)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Fecha de fabricaci\u00f3n no v\u00e1lida") from exc
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity <= 0:
        raise HTTPException(status_code=422, detail="La cantidad debe ser un entero positivo")
    target_company_id = user.company_id if user.company_id is not None else payload.get("company_id")
    if target_company_id is None or db.get(Company, target_company_id) is None:
        raise HTTPException(status_code=422, detail="Seleccione una empresa activa")
    recipe = db.scalar(select(Recipe).where(Recipe.id == recipe_id, Recipe.company_id == target_company_id))
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada en la empresa activa")
    if recipe.status != "Activa":
        raise HTTPException(status_code=422, detail="Solo se pueden producir recetas activas")
    base_name = payload.get("name") or recipe.name
    cure_days = (recipe.cure_time_minutes + 1439) // 1440
    production_date = manufacture_date + timedelta(days=cure_days)
    expiry = production_date + timedelta(days=recipe.shelf_life_days)
    product_code = payload.get("code") or f"PRD-{target_company_id}-{date.today():%y%m%d}-{db.scalar(select(func.count(Product.id)).where(Product.company_id == target_company_id)) + 1:04d}"
    product = Product(code=product_code, name=base_name, category=payload.get("category", "Jab\u00f3n artesanal"), presentation=payload.get("presentation", "Barra"), price=payload.get("price", 0), cost=recipe.cost_per_bar, stock=quantity * recipe.estimated_bars, min_stock=payload.get("min_stock", 5), status="Publicado", scent=payload.get("scent"), benefits=payload.get("benefits"), recipe_id=recipe.id, manufacture_date=production_date, shelf_life_days=recipe.shelf_life_days, expiry_date=expiry, company_id=target_company_id)
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"product": product, "recipe_name": recipe.name, "batch_start_date": manufacture_date, "production_date": production_date, "cure_ready_date": production_date, "cure_time_minutes": recipe.cure_time_minutes, "time_before_expiry_days": recipe.shelf_life_days, "expiry_date": expiry}


@app.get("/api/ia/analitica", tags=["inteligencia-artificial"])
def analitica_ia(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    products = db.scalars(scoped_query(Product, user, db, empresa_id)).all()
    recipes = db.scalars(scoped_query(Recipe, user, db, empresa_id)).all()
    ingredients = db.scalars(scoped_query(Ingredient, user, db, empresa_id)).all()
    orders = db.scalars(scoped_query(Order, user, db, empresa_id)).all()
    active = [p for p in products if p.status == "Publicado"]
    low_stock = [p for p in products if p.stock <= p.min_stock]
    expiring = [p for p in products if p.expiry_date and p.expiry_date <= date.today() + timedelta(days=60)]
    margin = [(p.price - p.cost) / p.price * 100 for p in active if p.price > 0]
    category_stock = {}
    for product in products:
        category_stock[product.category] = category_stock.get(product.category, 0) + product.stock
    return {
        "generated_at": date.today().isoformat(),
        "summary": {"products": len(products), "active_products": len(active), "recipes": len(recipes), "low_stock_products": len(low_stock), "expiring_products": len(expiring), "open_orders": sum(1 for order in orders if order.status in {"Por preparar", "Listo para env\u00edo"}), "average_margin_pct": round(sum(margin) / len(margin), 1) if margin else 0, "inventory_value": round(sum(i.stock * i.unit_cost for i in ingredients), 2)},
        "recommendations": [
            *[{"priority": "high", "type": "stock", "title": f"Reponer {p.name}", "detail": f"Stock {p.stock} por debajo del m\u00ednimo {p.min_stock}.", "action": "programar_produccion"} for p in low_stock],
            *[{"priority": "high", "type": "expiry", "title": f"Revisar vencimiento: {p.name}", "detail": f"Lote con vencimiento {p.expiry_date.isoformat()}.", "action": "revisar_lote"} for p in expiring],
            *[{"priority": "medium", "type": "formulation", "title": f"Revisar ficha de {r.name}", "detail": "Confirma curado y vida \u00fatil antes de generar producto." , "action": "revisar_receta"} for r in recipes if r.cure_time_minutes < 0 or r.shelf_life_days * 1440 < r.cure_time_minutes],
        ],
        "stock_by_category": [{"category": k, "units": v} for k, v in sorted(category_stock.items())],
    }


@app.post("/api/ia/consultar", tags=["inteligencia-artificial"])
def consultar_ia(payload: dict, empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    question = str(payload.get("question", "")).strip()
    if not question:
        raise HTTPException(status_code=422, detail="Escribe una consulta para el asistente")
    analytics = analitica_ia(empresa_id, user, db)
    normalized = question.casefold()
    summary = analytics["summary"]
    answer = (f"La empresa tiene {summary['products']} productos y {summary['recipes']} recetas. "
              f"Hay {summary['low_stock_products']} productos bajo m\u00ednimo y {summary['expiring_products']} lotes pr\u00f3ximos a vencer. "
              f"El margen promedio estimado es {summary['average_margin_pct']}%. Estas cifras se calculan con los registros actuales; valida costos y vencimientos antes de tomar decisiones.")
    if any(word in normalized for word in ("stock", "inventario", "reponer")):
        answer = "Revisi\u00f3n de inventario: " + ("; ".join(item["detail"] for item in analytics["recommendations"] if item["type"] == "stock") or "no hay productos por debajo del stock m\u00ednimo.")
    elif any(word in normalized for word in ("vence", "vencimiento", "caduca")):
        answer = "Revisi\u00f3n de vida \u00fatil: " + ("; ".join(item["detail"] for item in analytics["recommendations"] if item["type"] == "expiry") or "no hay lotes que venzan en los pr\u00f3ximos 60 d\u00edas.")
    elif any(word in normalized for word in ("margen", "rentabilidad", "precio")):
        answer = f"El margen medio estimado de los productos publicados es {summary['average_margin_pct']}%. Es una estimaci\u00f3n sobre costo registrado y no incluye gastos indirectos, comisiones ni impuestos."
    return {"answer": answer, "source": "analitica_operativa", "generated_at": date.today().isoformat(), "disclaimer": "Asistente basado en datos registrados; no es un modelo generativo externo ni reemplaza revisi\u00f3n qu\u00edmica o contable."}


# ===================== ENDPOINTS CRUD PRODUCTOS =====================
@app.get("/api/productos", tags=["productos"])
def listar_productos(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(scoped_query(Product, user, db, empresa_id)).all()


@app.post("/api/productos", tags=["productos"], status_code=status.HTTP_201_CREATED)
def crear_producto(item: ProductSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    values = item.model_dump(exclude={"manufacture_date", "company_id"})
    recipe = None
    company_id = user.company_id if user.company_id is not None else item.company_id
    if company_id is None or db.get(Company, company_id) is None:
        raise HTTPException(status_code=422, detail="Seleccione una empresa v\u00e1lida para registrar el producto")
    if not is_global_admin(user, db) and company_id != user.company_id:
        raise HTTPException(status_code=403, detail="No puede registrar productos en otra empresa")
    if item.recipe_id:
        recipe = db.scalar(select(Recipe).where(Recipe.id == item.recipe_id, Recipe.company_id == company_id))
        if not recipe:
            raise HTTPException(status_code=404, detail="Receta no encontrada en la empresa")
        batch_start = item.manufacture_date or date.today()
        produced_on = batch_start + timedelta(days=(recipe.cure_time_minutes + 1439) // 1440)
        values["manufacture_date"] = produced_on
        values["expiry_date"] = produced_on + timedelta(days=recipe.shelf_life_days)
        values["shelf_life_days"] = recipe.shelf_life_days

    values["company_id"] = company_id
    prod = Product(**values)
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod


@app.put("/api/productos/{item_id}", tags=["productos"])
def actualizar_producto(item_id: int, item: ProductSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prod = db.scalar(select(Product).where(Product.id == item_id, Product.company_id == user.company_id)) if not is_global_admin(user, db) else db.get(Product, item_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for key, value in item.model_dump(exclude={"company_id", "manufacture_date"}).items():
        if key == "recipe_id" and value is not None:
            recipe = db.scalar(select(Recipe).where(Recipe.id == value, Recipe.company_id == prod.company_id))
            if not recipe:
                raise HTTPException(status_code=404, detail="Receta no encontrada en la empresa")
            prod.shelf_life_days = recipe.shelf_life_days
        setattr(prod, key, value)
    if item.recipe_id:
        recipe = db.scalar(select(Recipe).where(Recipe.id == item.recipe_id, Recipe.company_id == prod.company_id))
        if recipe is None:
            raise HTTPException(status_code=404, detail="Receta no encontrada en la empresa")
        prod.shelf_life_days = recipe.shelf_life_days
        prod.manufacture_date = item.manufacture_date or date.today()
        prod.expiry_date = prod.manufacture_date + timedelta(days=prod.shelf_life_days)
    elif prod.recipe_id is not None:
        prod.recipe_id = None
        prod.manufacture_date = None
        prod.expiry_date = None
    db.commit()
    db.refresh(prod)
    return prod


@app.delete("/api/productos/{item_id}", tags=["productos"], status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prod = db.scalar(select(Product).where(Product.id == item_id, Product.company_id == user.company_id)) if not is_global_admin(user, db) else db.get(Product, item_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(prod)
    db.commit()
    return None


# ===================== ENDPOINTS CRUD RECETAS =====================
@app.get("/api/recetas", tags=["recetas"])
def listar_recetas(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(scoped_query(Recipe, user, db, empresa_id)).all()


@app.post("/api/recetas", tags=["recetas"], status_code=status.HTTP_201_CREATED)
def crear_receta(item: RecipeSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cure_minutes = item.normalized_cure_minutes()
    company_id = user.company_id if user.company_id is not None else item.company_id
    if company_id is None or db.get(Company, company_id) is None:
        raise HTTPException(status_code=422, detail="Seleccione una empresa v\u00e1lida para la receta")
    if not is_global_admin(user, db) and item.company_id not in (None, user.company_id):
        raise HTTPException(status_code=403, detail="No puede crear recetas en otra empresa")
    legacy_values = {}
    from sqlalchemy import inspect
    try:
        columns = {column["name"] for column in inspect(engine).get_columns("recipes")}
        if "cure_time_days" in columns:
            legacy_values["cure_time_days"] = (cure_minutes + 1439) // 1440
    except SQLAlchemyError:
        pass
    rec = create_scoped(item, Recipe, user, db, company_id=company_id, cure_time_minutes=cure_minutes, **legacy_values)
    return rec


@app.put("/api/recetas/{item_id}", tags=["recetas"])
def actualizar_receta(item_id: int, item: RecipeSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.scalar(select(Recipe).where(Recipe.id == item_id, Recipe.company_id == user.company_id)) if not is_global_admin(user, db) else db.get(Recipe, item_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    cure_minutes = item.normalized_cure_minutes()
    for key, value in item.model_dump(exclude={"company_id", "cure_time_value", "cure_time_unit", "cure_time_days", "cure_time_minutes"}).items():
        setattr(rec, key, value)
    rec.cure_time_minutes = item.normalized_cure_minutes()
    if hasattr(rec, "cure_time_days"):
        rec.cure_time_days = max(0, int((rec.cure_time_minutes + 1439) // 1440))
    db.commit()
    db.refresh(rec)
    return rec


@app.delete("/api/recetas/{item_id}", tags=["recetas"], status_code=status.HTTP_204_NO_CONTENT)
def eliminar_receta(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rec = db.scalar(select(Recipe).where(Recipe.id == item_id, Recipe.company_id == user.company_id)) if not is_global_admin(user, db) else db.get(Recipe, item_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    db.delete(rec)
    db.commit()
    return None


# ===================== ENDPOINTS CRUD INSUMOS =====================
@app.get("/api/insumos", tags=["insumos"])
def listar_insumos(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(scoped_query(Ingredient, user, db, empresa_id)).all()


@app.post("/api/insumos", tags=["insumos"], status_code=status.HTTP_201_CREATED)
def crear_insumo(item: IngredientSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ins = create_scoped(item, Ingredient, user, db)
    return ins


@app.put("/api/insumos/{item_id}", tags=["insumos"])
def actualizar_insumo(item_id: int, item: IngredientSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ins = db.scalar(select(Ingredient).where(Ingredient.id == item_id, Ingredient.company_id == user.company_id)) if not is_global_admin(user, db) else db.get(Ingredient, item_id)
    if not ins:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    for key, value in item.model_dump().items():
        setattr(ins, key, value)
    db.commit()
    db.refresh(ins)
    return ins


@app.delete("/api/insumos/{item_id}", tags=["insumos"], status_code=status.HTTP_204_NO_CONTENT)
def eliminar_insumo(item_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ins = db.scalar(select(Ingredient).where(Ingredient.id == item_id, Ingredient.company_id == user.company_id)) if not is_global_admin(user, db) else db.get(Ingredient, item_id)
    if not ins:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    db.delete(ins)
    db.commit()
    return None


# ===================== ENDPOINTS CRUD COMPRAS =====================
@app.get("/api/compras", tags=["compras"])
def listar_compras(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(scoped_query(Purchase, user, db, empresa_id)).all()


@app.post("/api/compras", tags=["compras"], status_code=status.HTTP_201_CREATED)
def crear_compra(item: PurchaseSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    compra = create_scoped(item, Purchase, user, db)
    return compra


# ===================== ENDPOINTS CRUD PROVEEDORES =====================
@app.get("/api/proveedores", tags=["proveedores"])
def listar_proveedores(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(scoped_query(Supplier, user, db, empresa_id)).all()


@app.post("/api/proveedores", tags=["proveedores"], status_code=status.HTTP_201_CREATED)
def crear_proveedor(item: SupplierSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    prov = create_scoped(item, Supplier, user, db)
    return prov


# ===================== ENDPOINTS CRUD PEDIDOS =====================
@app.get("/api/pedidos", tags=["pedidos"])
def listar_pedidos(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(scoped_query(Order, user, db, empresa_id)).all()


@app.post("/api/pedidos", tags=["pedidos"], status_code=status.HTTP_201_CREATED)
def crear_pedido(item: OrderSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pedido = create_scoped(item, Order, user, db)
    return pedido


# ===================== ENDPOINTS CRUD CLIENTES =====================
@app.get("/api/clientes", tags=["clientes"])
def listar_clientes(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(scoped_query(Customer, user, db, empresa_id).order_by(Customer.name.asc())).all()


@app.post("/api/clientes", tags=["clientes"], status_code=status.HTTP_201_CREATED)
def crear_cliente(item: CustomerSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cli = create_scoped(item, Customer, user, db)
    return cli


# ===================== ENDPOINTS CRUD FACTURACIÓN =====================
@app.get("/api/facturas", tags=["facturacion"])
def listar_facturas(empresa_id: Optional[int] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(scoped_query(Invoice, user, db, empresa_id)).all()


@app.post("/api/facturas", tags=["facturacion"], status_code=status.HTTP_201_CREATED)
def crear_factura(item: InvoiceSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fac = create_scoped(item, Invoice, user, db)
    return fac
