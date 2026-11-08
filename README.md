# SoapyFUN

Aplicación web multiplataforma para jabonería artesanal: recetas, costos, inventario y precios.

## Stack previsto

- Frontend: Angular 19, TailwindCSS y TypeScript.
- API: Python con FastAPI.
- Base de datos: PostgreSQL.
- Interfaz adaptable a móviles, tabletas y computadoras; instalable como PWA en una fase posterior.

## Estructura

- `frontend/`: aplicación Angular.
- `backend/`: API FastAPI y lógica de negocio.
- `docs/`: decisiones, alcance y especificación funcional.
- `icon.svg`: icono inicial de la marca.

## Ejecutar localmente

1. Instala dependencias Python: `python -m pip install -e "./backend[dev]"`.
2. Copia `backend/.env.example` a `backend/.env` y completa el usuario, la contraseña y la base de datos de PostgreSQL (puerto 15432). No guardes el archivo `.env` en Git.
3. Terminal 1: desde `backend`, carga `.env` a la sesión PowerShell y ejecuta `python run.py` (inicia Uvicorn apuntando a `app.main:app`).
4. Terminal 2: desde `frontend`, `npm start`; abre `http://localhost:4200`.

La interfaz actual es un prototipo interactivo con datos de demostración locales. La persistencia de módulos, la autenticación y los comprobantes fiscales requieren implementación e integración posteriores.

## Seguridad de configuración

Las credenciales se configuran localmente mediante variables de entorno. No guardar contraseñas, claves ni `.env` en el repositorio. Ver `.env.example`.

## Estado

Inicio del proyecto. Consultar `docs/alcance-inicial.md` para los módulos propuestos.
