from dataclasses import dataclass
from pathlib import Path
import os

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


@dataclass(frozen=True)
class Settings:
    postgres_host: str
    postgres_port: int
    postgres_db: str
    postgres_user: str
    postgres_password: str
    api_port: int

    @property
    def connection_string(self) -> str:
        return (
            f"host={self.postgres_host} port={self.postgres_port} "
            f"dbname={self.postgres_db} user={self.postgres_user} "
            f"password={self.postgres_password} connect_timeout=5"
        )


def get_settings() -> Settings:
    password = os.getenv("POSTGRES_PASSWORD", "")
    if not password:
        raise RuntimeError(
            "Falta POSTGRES_PASSWORD. Crea backend/.env a partir de backend/.env.example."
        )

    return Settings(
        postgres_host=os.getenv("POSTGRES_HOST", "127.0.0.1"),
        postgres_port=int(os.getenv("POSTGRES_PORT", "15432")),
        postgres_db=os.getenv("POSTGRES_DB", "soapyfun"),
        postgres_user=os.getenv("POSTGRES_USER", "postgres"),
        postgres_password=password,
        api_port=int(os.getenv("API_PORT", "9000")),
    )
