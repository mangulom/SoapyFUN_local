# SoapyFUN — alcance inicial

## Objetivo

Ayudar a pequeños negocios de jabonería artesanal a formular, costear y fijar precios con cálculos transparentes, desde cualquier dispositivo.

## Módulos previstos

1. **Catálogo de insumos:** aceites, mantecas, sosa, fragancias, colorantes, moldes y empaques; presentaciones, proveedores, unidades y costos.
2. **Recetas y lotes:** cantidades, porcentajes, rendimiento, merma, mano de obra, gastos indirectos, proceso y versiones históricas.
3. **Calculadora para jabonería:** conversiones de unidades y porcentajes; estimación de costo por lote y por barra, con advertencias visibles. No presentar la IA como sustituto de validación química ni de prácticas de seguridad.
4. **Presentaciones y precios:** tamaños, empaque, canales, comisiones, impuestos configurables, margen/recargo diferenciados, redondeo y desglose verificable.
5. **Inventario y compras:** existencias, costo actualizado, alertas y trazabilidad de cambios.
6. **Panel y reportes:** productos, costo, utilidad y escenarios; exportación de datos.
7. **Asistente IA (fase posterior):** consultas sobre los propios datos autorizados, extracción de precios desde documentos con confirmación humana y análisis de escenarios; nunca inventará datos ni reemplazará los cálculos deterministas.

## Prototipo interactivo implementado

- Panel responsive, menú móvil y navegación para negocio, abastecimiento, ventas y análisis.
- Vitrina/catálogo de productos, alta de producto y cálculo de margen indicativo.
- Insumos con costo actual, nivel mínimo y valorización; formulario de compra que actualiza stock y costo en memoria.
- Lista de proveedores, órdenes de compra de demostración, pedidos, clientes, borradores de factura y reportes.
- Alta de pedido actualiza stock de producto y muestra o incorpora el cliente.
- La demo no persiste datos al recargar y no emite comprobantes fiscales. La API todavía solo tiene health checks; conexión de negocio a PostgreSQL pendiente.
- El backend incluye una primera función determinista y probada para desglosar precios, separando recargo de margen y rechazando porcentajes inválidos.

## Requisitos transversales

- Diseño responsive y pruebas para móvil, tableta y escritorio; detección basada en capacidades y tamaño de pantalla, no en identificación rígida del dispositivo.
- Privacidad y aislamiento de datos por cuenta/negocio, autenticación segura, auditoría y copias de seguridad.
- La configuración local de PostgreSQL usa host/puerto por variables de entorno. No almacenar secretos en el código o Git.
- Separar interfaz (Angular 19 + TailwindCSS), API (Python/FastAPI) y persistencia (PostgreSQL).

## Decisiones pendientes antes de implementar cálculos de saponificación

- Tipo de jabón y métodos cubiertos (proceso en frío, caliente, melt-and-pour u otros).
- Fuente y versión de valores SAP, sobreengrasado, pureza de álcali y reglas de redondeo; permitir al usuario revisar y confirmar.
- Países/monedas/impuestos y niveles de privacidad requeridos.
- Proveedor/modelo de IA y política de retención de datos.
