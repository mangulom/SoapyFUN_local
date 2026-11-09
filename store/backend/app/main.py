from contextlib import asynccontextmanager
from typing import Generator

import psycopg
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from psycopg.rows import dict_row

from .catalog import SEED_PRODUCTS
from .config import Settings, get_settings


settings = get_settings()


def get_connection() -> Generator[psycopg.Connection, None, None]:
    with psycopg.connect(settings.connection_string, row_factory=dict_row) as connection:
        yield connection


def prepare_catalog() -> None:
    with psycopg.connect(settings.connection_string, row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS store_products (
                    id VARCHAR(80) PRIMARY KEY,
                    name VARCHAR(160) NOT NULL,
                    category VARCHAR(80) NOT NULL,
                    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
                    size VARCHAR(40) NOT NULL,
                    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
                    reviews INTEGER NOT NULL DEFAULT 0 CHECK (reviews >= 0),
                    badge VARCHAR(80),
                    visual VARCHAR(40) NOT NULL,
                    description TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            cursor.execute("SELECT COUNT(*) AS total FROM store_products")
            total = cursor.fetchone()["total"]
            if total == 0:
                cursor.executemany(
                    """
                    INSERT INTO store_products
                    (id, name, category, price, size, rating, reviews, badge, visual, description)
                    VALUES
                    (%(id)s, %(name)s, %(category)s, %(price)s, %(size)s, %(rating)s,
                     %(reviews)s, %(badge)s, %(visual)s, %(description)s)
                    """,
                    SEED_PRODUCTS,
                )
        connection.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    prepare_catalog()
    yield


app = FastAPI(title="Lúmina Catalog API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4201", "http://127.0.0.1:4201"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


def serialize_product(product: dict) -> dict:
    product["price"] = float(product["price"])
    product["rating"] = float(product["rating"])
    return product


@app.get("/api/health")
def health(connection: psycopg.Connection = Depends(get_connection)) -> dict:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1 AS status")
        cursor.fetchone()
    return {"status": "ok", "service": "lumina-api", "database": settings.postgres_db}


@app.get("/api/products")
def list_products(
    category: str | None = Query(default=None, max_length=80),
    search: str | None = Query(default=None, max_length=120),
    connection: psycopg.Connection = Depends(get_connection),
) -> dict:
    clauses: list[str] = []
    params: dict[str, str] = {}
    if category and category != "Todo":
        clauses.append("category = %(category)s")
        params["category"] = category
    if search:
        clauses.append("(name ILIKE %(search)s OR category ILIKE %(search)s OR description ILIKE %(search)s)")
        params["search"] = f"%{search.strip()}%"

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT id, name, category, price, size, rating, reviews, badge, visual, description FROM store_products {where} ORDER BY created_at", params)
        products = [serialize_product(product) for product in cursor.fetchall()]
        cursor.execute("SELECT DISTINCT category FROM store_products ORDER BY category")
        categories = ["Todo", *[row["category"] for row in cursor.fetchall()]]
    return {"products": products, "count": len(products), "categories": categories}


@app.get("/api/products/{product_id}")
def get_product(product_id: str, connection: psycopg.Connection = Depends(get_connection)) -> dict:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, name, category, price, size, rating, reviews, badge, visual, description FROM store_products WHERE id = %(id)s",
            {"id": product_id},
        )
        product = cursor.fetchone()
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return {"product": serialize_product(product)}
