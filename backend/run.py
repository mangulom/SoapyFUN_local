"""Start the SoapyFUN API from the backend directory with Uvicorn.

Usage:
    python run.py
    python run.py --port 8010
"""

import argparse
import os
from pathlib import Path

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Run SoapyFUN FastAPI backend")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Bind port (default: 8000)")
    parser.add_argument("--no-reload", action="store_true", help="Disable auto reload")
    args = parser.parse_args()

    # When launched from backend/ without a .env file, provide a harmless local
    # PostgreSQL default for startup. Connection is only required by readiness.
    os.chdir(Path(__file__).parent)
    if not os.getenv("DATABASE_URL") and not (Path(__file__).parent / ".env").exists():
        raise SystemExit("Missing backend/.env. Copy .env.example and configure DATABASE_URL and SECRET_KEY.")
    if not os.getenv("SECRET_KEY") and not (Path(__file__).parent / ".env").exists():
        raise SystemExit("Missing SECRET_KEY in backend/.env. Configure a local signing secret before starting the API.")

    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=not args.no_reload)


if __name__ == "__main__":
    main()
