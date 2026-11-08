from typing import Optional
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import engine, get_db
from app.models import (
    Base,
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
    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        usuario=UserResponse(id=user.id, email=user.email, nombre=user.full_name, rol=role.name if role else "user"),
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
    return UserResponse(id=user.id, email=user.email, nombre=user.full_name, rol=role.name if role else "user")


@app.get("/api/health/ready", tags=["system"])
def readiness() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return {"status": "degraded", "database": "unavailable"}
    return {"status": "ok", "database": "available"}


# ===================== ENDPOINTS CRUD PRODUCTOS =====================
@app.get("/api/productos", tags=["productos"])
def listar_productos(db: Session = Depends(get_db)):
    return db.scalars(select(Product).order_by(Product.id.desc())).all()


@app.post("/api/productos", tags=["productos"], status_code=status.HTTP_201_CREATED)
def crear_producto(item: ProductSchema, db: Session = Depends(get_db)):
    prod = Product(**item.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod


@app.put("/api/productos/{item_id}", tags=["productos"])
def actualizar_producto(item_id: int, item: ProductSchema, db: Session = Depends(get_db)):
    prod = db.get(Product, item_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    for key, value in item.model_dump().items():
        setattr(prod, key, value)
    db.commit()
    db.refresh(prod)
    return prod


@app.delete("/api/productos/{item_id}", tags=["productos"], status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(item_id: int, db: Session = Depends(get_db)):
    prod = db.get(Product, item_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(prod)
    db.commit()
    return None


# ===================== ENDPOINTS CRUD RECETAS =====================
@app.get("/api/recetas", tags=["recetas"])
def listar_recetas(db: Session = Depends(get_db)):
    return db.scalars(select(Recipe).order_by(Recipe.id.desc())).all()


@app.post("/api/recetas", tags=["recetas"], status_code=status.HTTP_201_CREATED)
def crear_receta(item: RecipeSchema, db: Session = Depends(get_db)):
    rec = Recipe(**item.model_dump())
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


@app.put("/api/recetas/{item_id}", tags=["recetas"])
def actualizar_receta(item_id: int, item: RecipeSchema, db: Session = Depends(get_db)):
    rec = db.get(Recipe, item_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    for key, value in item.model_dump().items():
        setattr(rec, key, value)
    db.commit()
    db.refresh(rec)
    return rec


@app.delete("/api/recetas/{item_id}", tags=["recetas"], status_code=status.HTTP_204_NO_CONTENT)
def eliminar_receta(item_id: int, db: Session = Depends(get_db)):
    rec = db.get(Recipe, item_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    db.delete(rec)
    db.commit()
    return None


# ===================== ENDPOINTS CRUD INSUMOS =====================
@app.get("/api/insumos", tags=["insumos"])
def listar_insumos(db: Session = Depends(get_db)):
    return db.scalars(select(Ingredient).order_by(Ingredient.id.desc())).all()


@app.post("/api/insumos", tags=["insumos"], status_code=status.HTTP_201_CREATED)
def crear_insumo(item: IngredientSchema, db: Session = Depends(get_db)):
    ins = Ingredient(**item.model_dump())
    db.add(ins)
    db.commit()
    db.refresh(ins)
    return ins


@app.put("/api/insumos/{item_id}", tags=["insumos"])
def actualizar_insumo(item_id: int, item: IngredientSchema, db: Session = Depends(get_db)):
    ins = db.get(Ingredient, item_id)
    if not ins:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    for key, value in item.model_dump().items():
        setattr(ins, key, value)
    db.commit()
    db.refresh(ins)
    return ins


@app.delete("/api/insumos/{item_id}", tags=["insumos"], status_code=status.HTTP_204_NO_CONTENT)
def eliminar_insumo(item_id: int, db: Session = Depends(get_db)):
    ins = db.get(Ingredient, item_id)
    if not ins:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    db.delete(ins)
    db.commit()
    return None


# ===================== ENDPOINTS CRUD COMPRAS =====================
@app.get("/api/compras", tags=["compras"])
def listar_compras(db: Session = Depends(get_db)):
    return db.scalars(select(Purchase).order_by(Purchase.id.desc())).all()


@app.post("/api/compras", tags=["compras"], status_code=status.HTTP_201_CREATED)
def crear_compra(item: PurchaseSchema, db: Session = Depends(get_db)):
    compra = Purchase(**item.model_dump())
    db.add(compra)
    db.commit()
    db.refresh(compra)
    return compra


# ===================== ENDPOINTS CRUD PROVEEDORES =====================
@app.get("/api/proveedores", tags=["proveedores"])
def listar_proveedores(db: Session = Depends(get_db)):
    return db.scalars(select(Supplier).order_by(Supplier.name.asc())).all()


@app.post("/api/proveedores", tags=["proveedores"], status_code=status.HTTP_201_CREATED)
def crear_proveedor(item: SupplierSchema, db: Session = Depends(get_db)):
    prov = Supplier(**item.model_dump())
    db.add(prov)
    db.commit()
    db.refresh(prov)
    return prov


# ===================== ENDPOINTS CRUD PEDIDOS =====================
@app.get("/api/pedidos", tags=["pedidos"])
def listar_pedidos(db: Session = Depends(get_db)):
    return db.scalars(select(Order).order_by(Order.id.desc())).all()


@app.post("/api/pedidos", tags=["pedidos"], status_code=status.HTTP_201_CREATED)
def crear_pedido(item: OrderSchema, db: Session = Depends(get_db)):
    pedido = Order(**item.model_dump())
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    return pedido


# ===================== ENDPOINTS CRUD CLIENTES =====================
@app.get("/api/clientes", tags=["clientes"])
def listar_clientes(db: Session = Depends(get_db)):
    return db.scalars(select(Customer).order_by(Customer.name.asc())).all()


@app.post("/api/clientes", tags=["clientes"], status_code=status.HTTP_201_CREATED)
def crear_cliente(item: CustomerSchema, db: Session = Depends(get_db)):
    cli = Customer(**item.model_dump())
    db.add(cli)
    db.commit()
    db.refresh(cli)
    return cli


# ===================== ENDPOINTS CRUD FACTURACIÓN =====================
@app.get("/api/facturas", tags=["facturacion"])
def listar_facturas(db: Session = Depends(get_db)):
    return db.scalars(select(Invoice).order_by(Invoice.id.desc())).all()


@app.post("/api/facturas", tags=["facturacion"], status_code=status.HTTP_201_CREATED)
def crear_factura(item: InvoiceSchema, db: Session = Depends(get_db)):
    fac = Invoice(**item.model_dump())
    db.add(fac)
    db.commit()
    db.refresh(fac)
    return fac
