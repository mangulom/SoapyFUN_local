# Backend SoapyFUN

API Python prevista con FastAPI. Configurar PostgreSQL mediante `DATABASE_URL` del entorno local; no copiar secretos al repositorio. La lógica de costos y precios debe vivir en servicios deterministas con pruebas automatizadas.

Desde este directorio, ejecutar `python run.py`. El lanzador usa Uvicorn con `app.main:app`, recarga automática y escucha en `127.0.0.1:8000`. Las rutas `/health` y `/api/health` devuelven estado. Opciones: `python run.py --host 0.0.0.0 --port 8000 --no-reload` para pruebas en la red local.

## PostgreSQL y administrador local

1. Copia `.env.example` a `.env` y configura `DATABASE_URL` y un `SECRET_KEY` aleatorio (32+ caracteres). `.env` está ignorado por Git.
2. Ejecuta `python init_db.py` para crear tablas y rol `admin`.
3. Para crear la primera cuenta, establece temporalmente `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ caracteres) y `ADMIN_NAME` en el entorno, y ejecuta otra vez `python init_db.py`. El nombre inicial sugerido es Rocío Nuñez Kikushima. La contraseña queda guardada solo como hash Argon2. No se registran ni se imprimen credenciales.

Demo local actual: `admin@soapyfun.local` / `SoapyFUN2026!`. Cámbiala antes de usar datos reales. En Windows PowerShell puedes iniciar el backend cargando `.env` con `Get-Content .env | ForEach-Object { if ($_ -match '^([^#=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') } }; python run.py`.
