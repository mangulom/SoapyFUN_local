# Lúmina Store

Tienda de cosmética premium de estética oro rosa, con frontend Angular 19 + Tailwind CSS y API en Python 3.11.8 con PostgreSQL.

## Iniciar el proyecto

Requiere Node.js 18 o posterior y Python **3.11.8**. Instala las dependencias del frontend una vez:

```powershell
npm install
```

Después de instalar Python 3.11.8, crea el entorno del backend e instala sus dependencias:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
Copy-Item backend\.env.example backend\.env
```

En `backend/.env` configura las credenciales de PostgreSQL. El proyecto espera la base `soapyfun` en el puerto `15432`; el archivo queda fuera de control de versiones.

```powershell
npm run dev
```

- Frontend: http://localhost:4201
- API: http://localhost:9000

También se pueden iniciar por separado:

```powershell
npm run start:api
npm run start:web
```

Para generar una compilación de producción del frontend:

```powershell
npm run build
npm run preview
```

## API disponible

- `GET /api/health`
- `GET /api/products`
- `GET /api/products?category=Rostro`
- `GET /api/products/:id`

El catálogo está en PostgreSQL, en la tabla `store_products`. Al iniciar por primera vez, la API crea esta tabla y carga ocho productos de demostración únicamente si está vacía.

## Funcionalidades incluidas

- Catálogo de 8 productos con filtros y ordenamiento.
- Buscador, vista rápida de producto y bolsa de compra con persistencia en el navegador.
- Diseño responsive en tonos marfil, rosa nude y oro rosa.
- Suscripción visual y estados de interacción para añadir productos, actualizar cantidades y finalizar compra.
