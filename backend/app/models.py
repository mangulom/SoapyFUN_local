from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    presentation: Mapped[str] = mapped_column(String(80), nullable=False, default="Barra 100 g")
    price: Mapped[float] = mapped_column(Float, nullable=False)
    cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Publicado")
    scent: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    benefits: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="🧼")
    tone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True, default="lavender")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    method: Mapped[str] = mapped_column(String(60), nullable=False, default="Proceso en frío")
    batch_grams: Mapped[float] = mapped_column(Float, nullable=False, default=1000.0)
    estimated_bars: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    cost_per_bar: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_batch_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    superfat_pct: Mapped[float] = mapped_column(Float, nullable=False, default=8.0)
    lye_concentration_pct: Mapped[float] = mapped_column(Float, nullable=False, default=30.0)
    version: Mapped[str] = mapped_column(String(20), nullable=False, default="v1")
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Activa")
    safety_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    group_name: Mapped[str] = mapped_column(String(80), nullable=False)
    stock: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")
    min_stock: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    unit_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    supplier_name: Mapped[str] = mapped_column(String(160), nullable=False)
    brand: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    purchase_date: Mapped[str] = mapped_column(String(30), nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(160), nullable=False)
    ingredient_name: Mapped[str] = mapped_column(String(160), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    unit_cost: Mapped[float] = mapped_column(Float, nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    invoice_number: Mapped[Optional[str]] = mapped_column(String(60), nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Recibida")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(254), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(80), nullable=True, default="Lima")
    rating: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    total_purchases: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_spent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    customer_name: Mapped[str] = mapped_column(String(160), nullable=False)
    channel: Mapped[str] = mapped_column(String(60), nullable=False, default="Tienda web")
    payment_method: Mapped[str] = mapped_column(String(60), nullable=False, default="Yape / Plin")
    items_summary: Mapped[str] = mapped_column(String(255), nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="Por preparar")
    delivery_address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    segment: Mapped[str] = mapped_column(String(50), nullable=False, default="Nueva")
    city: Mapped[Optional[str]] = mapped_column(String(80), nullable=True, default="Lima")
    total_orders: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_spent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    last_order: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_number: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    invoice_type: Mapped[str] = mapped_column(String(40), nullable=False, default="Borrador comercial")
    customer_name: Mapped[str] = mapped_column(String(160), nullable=False)
    customer_doc: Mapped[str] = mapped_column(String(40), nullable=False)
    issue_date: Mapped[str] = mapped_column(String(30), nullable=False)
    due_date: Mapped[str] = mapped_column(String(30), nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    tax: Mapped[float] = mapped_column(Float, nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="Pendiente")
    concept: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
