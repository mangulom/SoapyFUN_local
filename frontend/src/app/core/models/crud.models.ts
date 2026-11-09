export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string; // ej: 'Jabón corporal · Barra 100 g', 'Jabón facial · Barra 85 g', 'Jabón líquido · 250 ml'
  presentacion: string; // ej: 'Barra 100 g'
  precio: number;
  costo: number;
  stock: number;
  stockMinimo: number;
  estado: 'Publicado' | 'Borrador' | 'Agotado';
  aroma?: string;
  beneficios?: string;
  icono?: string;
  tono?: 'lavender' | 'honey' | 'citrus' | 'rose' | 'mint';
  fechaCreacion: string;
  fechaFabricacion?: string;
  fechaVencimiento?: string;
  vidaUtilDias?: number;
  recetaId?: string;
}

export interface RecetaIngrediente {
  insumoId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  porcentaje: number;
  costo: number;
}

export interface Receta {
  id: string;
  codigo: string;
  nombre: string;
  metodo: 'Proceso en frío' | 'Proceso en caliente' | 'Melt & Pour' | 'Jabón líquido KOH';
  loteGramos: number;
  barrasEstimadas: number;
  costoPorBarra: number;
  costoTotalLote: number;
  sobreengrasado: number; // % ej: 8%
  concentracionSosa: number; // % ej: 30%
  version: string; // ej: 'v3'
  fechaActualizacion: string;
  tiempoCuretajeDias: number; // legado para datos existentes
  tiempoCuretajeValor?: number;
  tiempoCuretajeUnidad?: 'minutes' | 'hours' | 'days';
  tiempoCuretajeMinutos?: number;
  tiempoAntesVencimientoDias?: number;
  vidaUtilDias: number; // compatibilidad: mismo valor que tiempoAntesVencimientoDias
  estado: 'Activa' | 'En prueba' | 'Archivada';
  ingredientesCount: number;
  notasSeguridad?: string;
}

export interface Insumo {
  id: string;
  codigo: string;
  nombre: string;
  grupo: 'Aceites y mantecas' | 'Álcalis y bases' | 'Fragancias y aceites esenciales' | 'Colorantes y micas' | 'Aditivos botánicos' | 'Empaques y envases';
  stock: number;
  unidad: 'kg' | 'g' | 'L' | 'ml' | 'unidades';
  stockMinimo: number;
  costoUnitario: number;
  proveedorPrincipal: string;
  color?: string;
  marca?: string;
  fechaActualizacion: string;
}

export interface Compra {
  id: string;
  codigo: string;
  fecha: string;
  proveedorId: string;
  proveedorNombre: string;
  insumoId: string;
  insumoNombre: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  total: number;
  numeroComprobante: string;
  estado: 'Recibida' | 'Pendiente' | 'Cancelada';
  notas?: string;
}

export interface Proveedor {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  contacto: string;
  telefono: string;
  email: string;
  ciudad: string;
  valoracion: number; // 1 a 5
  totalCompras: number;
  gastoTotal: number;
  estado: 'Activo' | 'Inactivo';
  color?: string;
  iniciales?: string;
  ultimaCompra?: string;
}

export interface PedidoItem {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  codigo: string; // PED-1048
  clienteId: string;
  clienteNombre: string;
  fecha: string;
  canal: 'Tienda web' | 'WhatsApp / Feria' | 'Instagram' | 'Taller / Presencial';
  metodoPago: 'Yape / Plin' | 'Transferencia BCP/BBVA' | 'Efectivo' | 'Tarjeta';
  items: PedidoItem[];
  itemsResumen: string;
  total: number;
  estado: 'Por preparar' | 'Listo para envío' | 'Entregado' | 'Cancelado';
  color?: 'amber' | 'blue' | 'green' | 'red';
  direccionEntrega?: string;
  notas?: string;
}

export interface Cliente {
  id: string;
  codigo: string;
  nombre: string;
  email: string;
  telefono: string;
  segmento: 'Nueva' | 'Frecuente' | 'Mayorista' | 'Taller / Alumna';
  ciudad: string;
  totalPedidos: number;
  gastoTotal: number;
  ultimaCompra: string;
  iniciales?: string;
  color?: string;
  notas?: string;
}

export interface FacturaItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface Factura {
  id: string;
  numero: string; // ej: 'BOR-2026-0042', 'BOL-001-00234'
  tipo: 'Borrador comercial' | 'Boleta preliminar' | 'Factura preliminar' | 'Nota de venta';
  clienteId: string;
  clienteNombre: string;
  clienteDocumento: string; // DNI o RUC
  fechaEmision: string;
  fechaVencimiento: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: 'Pendiente' | 'Pagado' | 'Anulado';
  conceptoResumen: string;
  items?: FacturaItem[];
  pedidoCodigo?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'Administradora' | 'Asistente de Producción' | 'Operaria de Taller' | 'Vendedora';
  activo: boolean;
  fechaRegistro: string;
  ultimoAcceso: string;
  iniciales?: string;
  empresaId?: number | null;
  empresaNombre?: string | null;
}

export interface Empresa {
  id: string; nombre: string; ruc?: string; dni?: string; direccion?: string; telefono?: string; email?: string; activa: boolean;
}
