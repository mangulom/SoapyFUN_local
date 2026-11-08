import { Injectable, computed, signal } from '@angular/core';
import {
  Cliente,
  Compra,
  Factura,
  Insumo,
  Pedido,
  Producto,
  Proveedor,
  Receta,
  Usuario,
} from '../models/crud.models';

const STORAGE_KEY = 'soapyfun_crud_data_v1';

export interface ToastMessage {
  id: number;
  tipo: 'success' | 'info' | 'warn' | 'error';
  titulo: string;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class CrudDataService {
  // Signals para cada colección
  readonly productos = signal<Producto[]>([]);
  readonly recetas = signal<Receta[]>([]);
  readonly insumos = signal<Insumo[]>([]);
  readonly compras = signal<Compra[]>([]);
  readonly proveedores = signal<Proveedor[]>([]);
  readonly pedidos = signal<Pedido[]>([]);
  readonly clientes = signal<Cliente[]>([]);
  readonly facturas = signal<Factura[]>([]);
  readonly usuarios = signal<Usuario[]>([]);

  // Notificaciones Toast
  readonly toasts = signal<ToastMessage[]>([]);

  // Métricas computadas globales
  readonly totalVentas = computed(() => {
    return this.pedidos()
      .filter((p) => p.estado !== 'Cancelado')
      .reduce((sum, p) => sum + p.total, 0);
  });

  readonly pedidosAbiertos = computed(() => {
    return this.pedidos().filter((p) => p.estado === 'Por preparar' || p.estado === 'Listo para envío');
  });

  readonly productosActivos = computed(() => {
    return this.productos().filter((p) => p.estado === 'Publicado');
  });

  readonly productosBajoStock = computed(() => {
    return this.productos().filter((p) => p.stock <= p.stockMinimo);
  });

  readonly valorInventarioInsumos = computed(() => {
    return this.insumos().reduce((sum, item) => sum + item.stock * item.costoUnitario, 0);
  });

  readonly insumosBajoStock = computed(() => {
    return this.insumos().filter((i) => i.stock <= i.stockMinimo);
  });

  readonly totalClientes = computed(() => this.clientes().length);

  constructor() {
    this.cargarDatos();
  }

  // ================= NOTIFICACIONES TOAST =================
  notify(tipo: 'success' | 'info' | 'warn' | 'error', titulo: string, mensaje: string): void {
    const id = Date.now() + Math.random();
    this.toasts.update((list) => [...list, { id, tipo, titulo, mensaje }]);
    setTimeout(() => {
      this.toasts.update((list) => list.filter((t) => t.id !== id));
    }, 4000);
  }

  cerrarToast(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  // ================= CARGA Y PERSISTENCIA =================
  private guardarDatos(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        productos: this.productos(),
        recetas: this.recetas(),
        insumos: this.insumos(),
        compras: this.compras(),
        proveedores: this.proveedores(),
        pedidos: this.pedidos(),
        clientes: this.clientes(),
        facturas: this.facturas(),
        usuarios: this.usuarios(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error guardando en localStorage', e);
    }
  }

  private cargarDatos(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && Array.isArray(parsed.productos)) {
            this.productos.set(parsed.productos);
            this.recetas.set(parsed.recetas || []);
            this.insumos.set(parsed.insumos || []);
            this.compras.set(parsed.compras || []);
            this.proveedores.set(parsed.proveedores || []);
            this.pedidos.set(parsed.pedidos || []);
            this.clientes.set(parsed.clientes || []);
            this.facturas.set(parsed.facturas || []);
            this.usuarios.set(parsed.usuarios || []);
            return;
          }
        }
      } catch (e) {
        console.warn('Error leyendo localStorage, usando semillas iniciales', e);
      }
    }
    this.inicializarSemillas();
  }

  restablecerDatosDemo(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.inicializarSemillas();
    this.notify('info', 'Datos restablecidos', 'Se cargaron los datos de demostración iniciales.');
  }

  // ================= PRODUCTOS CRUD =================
  crearProducto(prod: Omit<Producto, 'id' | 'codigo' | 'fechaCreacion'>): Producto {
    const nuevo: Producto = {
      ...prod,
      id: 'prod_' + Date.now(),
      codigo: 'PRD-' + (this.productos().length + 1).toString().padStart(3, '0'),
      fechaCreacion: new Date().toISOString().slice(0, 10),
    };
    this.productos.update((list) => [nuevo, ...list]);
    this.guardarDatos();
    this.notify('success', 'Producto creado', `"${nuevo.nombre}" añadido al catálogo.`);
    return nuevo;
  }

  actualizarProducto(id: string, cambios: Partial<Producto>): void {
    this.productos.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...cambios } : p))
    );
    this.guardarDatos();
    this.notify('success', 'Producto actualizado', 'Los cambios han sido guardados.');
  }

  eliminarProducto(id: string): void {
    const p = this.productos().find((item) => item.id === id);
    this.productos.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (p) this.notify('warn', 'Producto eliminado', `"${p.nombre}" fue retirado.`);
  }

  // ================= RECETAS CRUD =================
  crearReceta(rec: Omit<Receta, 'id' | 'codigo' | 'fechaActualizacion' | 'costoTotalLote'>): Receta {
    const costoTotalLote = Number((rec.costoPorBarra * rec.barrasEstimadas).toFixed(2));
    const nueva: Receta = {
      ...rec,
      id: 'rec_' + Date.now(),
      codigo: 'REC-' + (this.recetas().length + 1).toString().padStart(3, '0'),
      costoTotalLote,
      fechaActualizacion: new Date().toISOString().slice(0, 10),
    };
    this.recetas.update((list) => [nueva, ...list]);
    this.guardarDatos();
    this.notify('success', 'Receta creada', `Fórmula "${nueva.nombre}" guardada con éxito.`);
    return nueva;
  }

  actualizarReceta(id: string, cambios: Partial<Receta>): void {
    this.recetas.update((list) =>
      list.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...cambios, fechaActualizacion: new Date().toISOString().slice(0, 10) };
          if (cambios.costoPorBarra !== undefined || cambios.barrasEstimadas !== undefined) {
            updated.costoTotalLote = Number((updated.costoPorBarra * updated.barrasEstimadas).toFixed(2));
          }
          return updated;
        }
        return r;
      })
    );
    this.guardarDatos();
    this.notify('success', 'Receta actualizada', 'Fórmula y especificaciones modificadas.');
  }

  duplicarReceta(id: string): void {
    const original = this.recetas().find((r) => r.id === id);
    if (!original) return;
    const vNum = parseInt(original.version.replace(/\D/g, '') || '1', 10) + 1;
    const nueva: Receta = {
      ...original,
      id: 'rec_' + Date.now(),
      codigo: 'REC-' + (this.recetas().length + 1).toString().padStart(3, '0'),
      nombre: `${original.nombre} (v${vNum})`,
      version: `v${vNum}`,
      estado: 'En prueba',
      fechaActualizacion: new Date().toISOString().slice(0, 10),
    };
    this.recetas.update((list) => [nueva, ...list]);
    this.guardarDatos();
    this.notify('info', 'Versión duplicada', `Se generó "${nueva.nombre}" para experimentación.`);
  }

  eliminarReceta(id: string): void {
    const r = this.recetas().find((item) => item.id === id);
    this.recetas.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (r) this.notify('warn', 'Receta eliminada', `"${r.nombre}" ha sido eliminada.`);
  }

  // ================= INSUMOS CRUD =================
  crearInsumo(ins: Omit<Insumo, 'id' | 'codigo' | 'fechaActualizacion'>): Insumo {
    const nuevo: Insumo = {
      ...ins,
      id: 'ins_' + Date.now(),
      codigo: 'INS-' + (this.insumos().length + 1).toString().padStart(3, '0'),
      fechaActualizacion: new Date().toISOString().slice(0, 10),
    };
    this.insumos.update((list) => [nuevo, ...list]);
    this.guardarDatos();
    this.notify('success', 'Insumo registrado', `"${nuevo.nombre}" agregado al almacén.`);
    return nuevo;
  }

  actualizarInsumo(id: string, cambios: Partial<Insumo>): void {
    this.insumos.update((list) =>
      list.map((i) => (i.id === id ? { ...i, ...cambios, fechaActualizacion: new Date().toISOString().slice(0, 10) } : i))
    );
    this.guardarDatos();
    this.notify('success', 'Insumo actualizado', 'Inventario y costo actualizados.');
  }

  ajustarStockInsumo(id: string, nuevoStock: number, motivo: string): void {
    this.insumos.update((list) =>
      list.map((i) => (i.id === id ? { ...i, stock: nuevoStock, fechaActualizacion: new Date().toISOString().slice(0, 10) } : i))
    );
    this.guardarDatos();
    this.notify('info', 'Stock ajustado', `Existencias actualizadas (${motivo}).`);
  }

  eliminarInsumo(id: string): void {
    const i = this.insumos().find((item) => item.id === id);
    this.insumos.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (i) this.notify('warn', 'Insumo eliminado', `"${i.nombre}" eliminado del catálogo.`);
  }

  // ================= COMPRAS CRUD =================
  crearCompra(cmp: Omit<Compra, 'id' | 'codigo' | 'total'>): Compra {
    const total = Number((cmp.cantidad * cmp.costoUnitario).toFixed(2));
    const nueva: Compra = {
      ...cmp,
      id: 'cmp_' + Date.now(),
      codigo: 'CMP-' + (this.compras().length + 1040).toString(),
      total,
    };
    this.compras.update((list) => [nueva, ...list]);

    // Si la compra está recibida, sumar existencias al insumo e impactar costo unitario promedio
    if (cmp.estado === 'Recibida' && cmp.insumoId) {
      const insumo = this.insumos().find((i) => i.id === cmp.insumoId);
      if (insumo) {
        const nuevoStock = Number((insumo.stock + cmp.cantidad).toFixed(2));
        // Costo promedio ponderado si ya había stock
        const valorActual = insumo.stock * insumo.costoUnitario;
        const valorNuevo = cmp.cantidad * cmp.costoUnitario;
        const nuevoCostoPromedio = nuevoStock > 0 ? Number(((valorActual + valorNuevo) / nuevoStock).toFixed(2)) : cmp.costoUnitario;

        this.insumos.update((list) =>
          list.map((i) =>
            i.id === cmp.insumoId
              ? { ...i, stock: nuevoStock, costoUnitario: nuevoCostoPromedio, fechaActualizacion: new Date().toISOString().slice(0, 10) }
              : i
          )
        );
      }

      // Sumar al proveedor compras realizadas
      this.proveedores.update((list) =>
        list.map((prov) =>
          prov.id === cmp.proveedorId
            ? {
                ...prov,
                totalCompras: prov.totalCompras + 1,
                gastoTotal: Number((prov.gastoTotal + total).toFixed(2)),
                ultimaCompra: cmp.fecha,
              }
            : prov
        )
      );
    }

    this.guardarDatos();
    this.notify('success', 'Compra registrada', `Orden ${nueva.codigo} de ${cmp.insumoNombre} por S/ ${total.toFixed(2)}.`);
    return nueva;
  }

  actualizarCompra(id: string, cambios: Partial<Compra>): void {
    this.compras.update((list) =>
      list.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...cambios };
          if (cambios.cantidad !== undefined || cambios.costoUnitario !== undefined) {
            updated.total = Number((updated.cantidad * updated.costoUnitario).toFixed(2));
          }
          return updated;
        }
        return c;
      })
    );
    this.guardarDatos();
    this.notify('success', 'Compra actualizada', 'Los datos de la orden fueron modificados.');
  }

  eliminarCompra(id: string): void {
    const c = this.compras().find((item) => item.id === id);
    this.compras.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (c) this.notify('warn', 'Compra eliminada', `Orden ${c.codigo} eliminada.`);
  }

  // ================= PROVEEDORES CRUD =================
  crearProveedor(prov: Omit<Proveedor, 'id' | 'codigo' | 'totalCompras' | 'gastoTotal'>): Proveedor {
    const initials = prov.nombre
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
    const nuevo: Proveedor = {
      ...prov,
      id: 'prov_' + Date.now(),
      codigo: 'PRV-' + (this.proveedores().length + 1).toString().padStart(3, '0'),
      totalCompras: 0,
      gastoTotal: 0,
      iniciales: initials || 'PR',
      color: prov.color || 'purple',
    };
    this.proveedores.update((list) => [nuevo, ...list]);
    this.guardarDatos();
    this.notify('success', 'Proveedor registrado', `"${nuevo.nombre}" añadido a la red.`);
    return nuevo;
  }

  actualizarProveedor(id: string, cambios: Partial<Proveedor>): void {
    this.proveedores.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...cambios } : p))
    );
    this.guardarDatos();
    this.notify('success', 'Proveedor actualizado', 'Datos de contacto y condiciones guardados.');
  }

  eliminarProveedor(id: string): void {
    const p = this.proveedores().find((item) => item.id === id);
    this.proveedores.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (p) this.notify('warn', 'Proveedor eliminado', `"${p.nombre}" ha sido retirado.`);
  }

  // ================= PEDIDOS CRUD =================
  crearPedido(ped: Omit<Pedido, 'id' | 'codigo' | 'fecha'>): Pedido {
    const nuevo: Pedido = {
      ...ped,
      id: 'ped_' + Date.now(),
      codigo: 'PED-' + (this.pedidos().length + 1049).toString(),
      fecha: new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    this.pedidos.update((list) => [nuevo, ...list]);

    // Reducir stock de productos asociados
    ped.items.forEach((it) => {
      this.productos.update((plist) =>
        plist.map((p) => {
          if (p.id === it.productoId || p.nombre === it.productoNombre) {
            const nuevoStock = Math.max(0, p.stock - it.cantidad);
            return {
              ...p,
              stock: nuevoStock,
              estado: nuevoStock === 0 ? 'Agotado' : p.estado,
            };
          }
          return p;
        })
      );
    });

    // Actualizar historial del cliente
    if (ped.clienteId) {
      this.clientes.update((clist) =>
        clist.map((c) =>
          c.id === ped.clienteId
            ? {
                ...c,
                totalPedidos: c.totalPedidos + 1,
                gastoTotal: Number((c.gastoTotal + ped.total).toFixed(2)),
                ultimaCompra: 'Hoy',
                segmento: c.totalPedidos >= 2 ? 'Frecuente' : c.segmento,
              }
            : c
        )
      );
    }

    this.guardarDatos();
    this.notify('success', 'Pedido creado', `Pedido ${nuevo.codigo} para ${nuevo.clienteNombre} por S/ ${nuevo.total.toFixed(2)}.`);
    return nuevo;
  }

  actualizarEstadoPedido(id: string, nuevoEstado: Pedido['estado']): void {
    this.pedidos.update((list) =>
      list.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    );
    this.guardarDatos();
    this.notify('info', 'Estado de pedido', `Pedido ${id} actualizado a "${nuevoEstado}".`);
  }

  actualizarPedido(id: string, cambios: Partial<Pedido>): void {
    this.pedidos.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...cambios } : p))
    );
    this.guardarDatos();
    this.notify('success', 'Pedido modificado', 'Datos del pedido guardados.');
  }

  eliminarPedido(id: string): void {
    const p = this.pedidos().find((item) => item.id === id);
    this.pedidos.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (p) this.notify('warn', 'Pedido cancelado', `Pedido ${p.codigo} eliminado.`);
  }

  // ================= CLIENTES CRUD =================
  crearCliente(cli: Omit<Cliente, 'id' | 'codigo' | 'totalPedidos' | 'gastoTotal' | 'ultimaCompra'>): Cliente {
    const initials = cli.nombre
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
    const nuevo: Cliente = {
      ...cli,
      id: 'cli_' + Date.now(),
      codigo: 'CLI-' + (this.clientes().length + 1).toString().padStart(3, '0'),
      totalPedidos: 0,
      gastoTotal: 0,
      ultimaCompra: 'Sin compras',
      iniciales: initials || 'CL',
      color: cli.color || 'violet',
    };
    this.clientes.update((list) => [nuevo, ...list]);
    this.guardarDatos();
    this.notify('success', 'Cliente registrado', `"${nuevo.nombre}" añadido a la comunidad.`);
    return nuevo;
  }

  actualizarCliente(id: string, cambios: Partial<Cliente>): void {
    this.clientes.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...cambios } : c))
    );
    this.guardarDatos();
    this.notify('success', 'Cliente actualizado', 'Ficha de clienta guardada.');
  }

  eliminarCliente(id: string): void {
    const c = this.clientes().find((item) => item.id === id);
    this.clientes.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (c) this.notify('warn', 'Cliente retirado', `"${c.nombre}" ha sido eliminado.`);
  }

  // ================= FACTURACIÓN CRUD =================
  crearFactura(fac: Omit<Factura, 'id' | 'numero' | 'igv' | 'total'>): Factura {
    const subtotal = fac.subtotal;
    const igv = Number((subtotal * 0.18).toFixed(2));
    const total = Number((subtotal + igv).toFixed(2));
    const prefix = fac.tipo === 'Factura preliminar' ? 'FAC-' : fac.tipo === 'Boleta preliminar' ? 'BOL-' : 'BOR-';
    const numero = prefix + '2026-' + (this.facturas().length + 1).toString().padStart(4, '0');

    const nueva: Factura = {
      ...fac,
      id: 'fac_' + Date.now(),
      numero,
      igv,
      total,
    };
    this.facturas.update((list) => [nueva, ...list]);
    this.guardarDatos();
    this.notify('success', 'Comprobante emitido', `${nueva.tipo} ${nueva.numero} por S/ ${total.toFixed(2)}.`);
    return nueva;
  }

  actualizarFactura(id: string, cambios: Partial<Factura>): void {
    this.facturas.update((list) =>
      list.map((f) => {
        if (f.id === id) {
          const updated = { ...f, ...cambios };
          if (cambios.subtotal !== undefined) {
            updated.igv = Number((updated.subtotal * 0.18).toFixed(2));
            updated.total = Number((updated.subtotal + updated.igv).toFixed(2));
          }
          return updated;
        }
        return f;
      })
    );
    this.guardarDatos();
    this.notify('success', 'Documento modificado', 'Comprobante actualizado.');
  }

  eliminarFactura(id: string): void {
    const f = this.facturas().find((item) => item.id === id);
    this.facturas.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (f) this.notify('warn', 'Documento anulado', `${f.numero} ha sido eliminado.`);
  }

  // ================= USUARIOS CRUD =================
  crearUsuario(usr: Omit<Usuario, 'id' | 'fechaRegistro' | 'ultimoAcceso'>): Usuario {
    const initials = usr.nombre
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('');
    const nuevo: Usuario = {
      ...usr,
      id: 'usr_' + Date.now(),
      iniciales: initials || 'US',
      fechaRegistro: new Date().toISOString().slice(0, 10),
      ultimoAcceso: 'Nunca',
    };
    this.usuarios.update((list) => [nuevo, ...list]);
    this.guardarDatos();
    this.notify('success', 'Usuario creado', `Cuenta para ${nuevo.nombre} con rol ${nuevo.rol}.`);
    return nuevo;
  }

  actualizarUsuario(id: string, cambios: Partial<Usuario>): void {
    this.usuarios.update((list) =>
      list.map((u) => (u.id === id ? { ...u, ...cambios } : u))
    );
    this.guardarDatos();
    this.notify('success', 'Usuario modificado', 'Permisos y datos actualizados.');
  }

  toggleActivoUsuario(id: string): void {
    this.usuarios.update((list) =>
      list.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    );
    this.guardarDatos();
    this.notify('info', 'Estado cambiado', 'Acceso de usuario modificado.');
  }

  eliminarUsuario(id: string): void {
    const u = this.usuarios().find((item) => item.id === id);
    this.usuarios.update((list) => list.filter((item) => item.id !== id));
    this.guardarDatos();
    if (u) this.notify('warn', 'Usuario eliminado', `Acceso de "${u.nombre}" revocado.`);
  }

  // ================= EXPORTACIÓN CSV =================
  exportarCsv(nombreArchivo: string, columnas: string[], filas: (string | number)[][]): void {
    if (typeof window === 'undefined') return;
    const contenido = [
      columnas.join(','),
      ...filas.map((fila) =>
        fila
          .map((v) => {
            const str = String(v ?? '').replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    const blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.notify('info', 'Exportación exitosa', `Archivo ${a.download} descargado.`);
  }

  // ================= DATOS SEMILLA ARTESANALES INICIALES =================
  private inicializarSemillas(): void {
    this.productos.set([
      {
        id: 'prod_1',
        codigo: 'PRD-001',
        nombre: 'Lavanda & Avena Calmante',
        categoria: 'Jabón corporal · Barra 100 g',
        presentacion: 'Barra 100 g',
        precio: 28.0,
        costo: 11.4,
        stock: 32,
        stockMinimo: 10,
        estado: 'Publicado',
        aroma: 'Lavanda francesa y miel',
        beneficios: 'Exfoliación suave, piel sensible y dermatitis',
        icono: '✿',
        tono: 'lavender',
        fechaCreacion: '2026-10-15',
      },
      {
        id: 'prod_2',
        codigo: 'PRD-002',
        nombre: 'Miel de la Mañana & Propóleo',
        categoria: 'Jabón facial · Barra 85 g',
        presentacion: 'Barra 85 g',
        precio: 32.0,
        costo: 13.2,
        stock: 18,
        stockMinimo: 8,
        estado: 'Publicado',
        aroma: 'Cera virgen y flores silvestres',
        beneficios: 'Nutrición profunda, regenerador cutáneo',
        icono: '☼',
        tono: 'honey',
        fechaCreacion: '2026-10-20',
      },
      {
        id: 'prod_3',
        codigo: 'PRD-003',
        nombre: 'Cítrico Botánico & Caléndula',
        categoria: 'Jabón corporal · Barra 100 g',
        presentacion: 'Barra 100 g',
        precio: 30.0,
        costo: 12.1,
        stock: 4,
        stockMinimo: 12,
        estado: 'Publicado',
        aroma: 'Naranja dulce, bergamota y cedro',
        beneficios: 'Energizante, astringente natural y antibacterial',
        icono: '✺',
        tono: 'citrus',
        fechaCreacion: '2026-10-25',
      },
      {
        id: 'prod_4',
        codigo: 'PRD-004',
        nombre: 'Rosa Mosqueta & Arcilla Rosa',
        categoria: 'Jabón facial · Barra 90 g',
        presentacion: 'Barra 90 g',
        precio: 36.0,
        costo: 14.8,
        stock: 22,
        stockMinimo: 10,
        estado: 'Publicado',
        aroma: 'Pétalos de rosa y geranio',
        beneficios: 'Antiage, unifica el tono, pieles maduras',
        icono: '❦',
        tono: 'rose',
        fechaCreacion: '2026-11-01',
      },
      {
        id: 'prod_5',
        codigo: 'PRD-005',
        nombre: 'Menta Piperita & Eucalipto Puro',
        categoria: 'Jabón spa · Barra 110 g',
        presentacion: 'Barra 110 g',
        precio: 29.0,
        costo: 10.9,
        stock: 0,
        stockMinimo: 8,
        estado: 'Agotado',
        aroma: 'Menta refrescante y bosque andino',
        beneficios: 'Descongestionante, activa la microcirculación',
        icono: '🍃',
        tono: 'mint',
        fechaCreacion: '2026-11-03',
      },
      {
        id: 'prod_6',
        codigo: 'PRD-006',
        nombre: 'Carbón Activado & Árbol de Té',
        categoria: 'Jabón desintoxicante · Barra 95 g',
        presentacion: 'Barra 95 g',
        precio: 34.0,
        costo: 12.5,
        stock: 15,
        stockMinimo: 6,
        estado: 'Borrador',
        aroma: 'Herbal fresco con toque de árbol de té',
        beneficios: 'Control de grasa, puntos negros y acné',
        icono: '◆',
        tono: 'citrus',
        fechaCreacion: '2026-11-06',
      },
    ]);

    this.recetas.set([
      {
        id: 'rec_1',
        codigo: 'REC-001',
        nombre: 'Lavanda & Avena Proceso en Frío',
        metodo: 'Proceso en frío',
        loteGramos: 1200,
        barrasEstimadas: 12,
        costoPorBarra: 11.4,
        costoTotalLote: 136.8,
        sobreengrasado: 8,
        concentracionSosa: 32,
        version: 'v3',
        fechaActualizacion: '2026-11-02',
        estado: 'Activa',
        ingredientesCount: 6,
        notasSeguridad: 'Usar gafas de protección y guantes de nitrilo al verter la sosa en agua destilada fría.',
      },
      {
        id: 'rec_2',
        codigo: 'REC-002',
        nombre: 'Miel & Propóleo Reparador',
        metodo: 'Proceso en frío',
        loteGramos: 1000,
        barrasEstimadas: 10,
        costoPorBarra: 13.2,
        costoTotalLote: 132.0,
        sobreengrasado: 9,
        concentracionSosa: 30,
        version: 'v2',
        fechaActualizacion: '2026-10-28',
        estado: 'Activa',
        ingredientesCount: 7,
        notasSeguridad: 'Añadir la miel en traza ligera disuelta en una cucharada de agua tibia para evitar caramelo.',
      },
      {
        id: 'rec_3',
        codigo: 'REC-003',
        nombre: 'Cítrico Botánico Melt & Pour',
        metodo: 'Melt & Pour',
        loteGramos: 800,
        barrasEstimadas: 8,
        costoPorBarra: 12.1,
        costoTotalLote: 96.8,
        sobreengrasado: 3,
        concentracionSosa: 0,
        version: 'v1',
        fechaActualizacion: '2026-10-20',
        estado: 'Activa',
        ingredientesCount: 4,
        notasSeguridad: 'Fundir a baño maría a máx 60°C para no deshidratar la base de glicerina vegetal.',
      },
      {
        id: 'rec_4',
        codigo: 'REC-004',
        nombre: 'Rosa Mosqueta Regenerante Experimental',
        metodo: 'Proceso en frío',
        loteGramos: 1500,
        barrasEstimadas: 15,
        costoPorBarra: 14.8,
        costoTotalLote: 222.0,
        sobreengrasado: 10,
        concentracionSosa: 33,
        version: 'v1',
        fechaActualizacion: '2026-11-04',
        estado: 'En prueba',
        ingredientesCount: 8,
        notasSeguridad: 'El aceite de rosa mosqueta virgen se agrega exclusivamente en traza para preservar antioxidantes.',
      },
    ]);

    this.insumos.set([
      {
        id: 'ins_1',
        codigo: 'INS-001',
        nombre: 'Aceite de Oliva Extra Virgen',
        grupo: 'Aceites y mantecas',
        stock: 4.5,
        unidad: 'L',
        stockMinimo: 2.0,
        costoUnitario: 38.0,
        proveedorPrincipal: 'Botánica Andina SAC',
        color: 'emerald',
        marca: 'OliAndes',
        fechaActualizacion: '2026-11-07',
      },
      {
        id: 'ins_2',
        codigo: 'INS-002',
        nombre: 'Manteca de Karité Cruda sin Refinar',
        grupo: 'Aceites y mantecas',
        stock: 0.7,
        unidad: 'kg',
        stockMinimo: 1.5,
        costoUnitario: 64.0,
        proveedorPrincipal: 'Esencias del Valle',
        color: 'amber',
        marca: 'BioKarité',
        fechaActualizacion: '2026-11-05',
      },
      {
        id: 'ins_3',
        codigo: 'INS-003',
        nombre: 'Hidróxido de Sodio (Sosa Cáustica 99%)',
        grupo: 'Álcalis y bases',
        stock: 3.2,
        unidad: 'kg',
        stockMinimo: 1.0,
        costoUnitario: 22.0,
        proveedorPrincipal: 'Química Natural Perú',
        color: 'violet',
        marca: 'PurezaLab',
        fechaActualizacion: '2026-10-25',
      },
      {
        id: 'ins_4',
        codigo: 'INS-004',
        nombre: 'Aceite Esencial Puro de Lavanda',
        grupo: 'Fragancias y aceites esenciales',
        stock: 250,
        unidad: 'ml',
        stockMinimo: 100,
        costoUnitario: 0.45,
        proveedorPrincipal: 'Aromas del Huerto',
        color: 'purple',
        marca: 'Lavandula Vera',
        fechaActualizacion: '2026-11-01',
      },
      {
        id: 'ins_5',
        codigo: 'INS-005',
        nombre: 'Aceite de Coco Virgen Prensado en Frío',
        grupo: 'Aceites y mantecas',
        stock: 2.8,
        unidad: 'L',
        stockMinimo: 2.0,
        costoUnitario: 42.0,
        proveedorPrincipal: 'Botánica Andina SAC',
        color: 'emerald',
        marca: 'CocoAndes',
        fechaActualizacion: '2026-11-02',
      },
      {
        id: 'ins_6',
        codigo: 'INS-006',
        nombre: 'Cajas de Cartón Kraft para Jabón 100g',
        grupo: 'Empaques y envases',
        stock: 120,
        unidad: 'unidades',
        stockMinimo: 50,
        costoUnitario: 0.85,
        proveedorPrincipal: 'Empaques Ecológicos Lima',
        color: 'amber',
        marca: 'EcoKraft',
        fechaActualizacion: '2026-10-30',
      },
    ]);

    this.compras.set([
      {
        id: 'cmp_1',
        codigo: 'CMP-1042',
        fecha: '2026-11-07',
        proveedorId: 'prov_1',
        proveedorNombre: 'Botánica Andina SAC',
        insumoId: 'ins_1',
        insumoNombre: 'Aceite de Oliva Extra Virgen',
        cantidad: 2.0,
        unidad: 'L',
        costoUnitario: 38.0,
        total: 76.0,
        numeroComprobante: 'FAC-001-8932',
        estado: 'Recibida',
        notas: 'Entregado en almacén de taller en óptimas condiciones.',
      },
      {
        id: 'cmp_2',
        codigo: 'CMP-1041',
        fecha: '2026-10-24',
        proveedorId: 'prov_2',
        proveedorNombre: 'Esencias del Valle',
        insumoId: 'ins_2',
        insumoNombre: 'Manteca de Karité Cruda',
        cantidad: 1.0,
        unidad: 'kg',
        costoUnitario: 64.0,
        total: 64.0,
        numeroComprobante: 'BOL-002-4410',
        estado: 'Recibida',
        notas: 'Materia prima grado cosmético con certificado de análisis.',
      },
      {
        id: 'cmp_3',
        codigo: 'CMP-1040',
        fecha: '2026-10-18',
        proveedorId: 'prov_3',
        proveedorNombre: 'Química Natural Perú',
        insumoId: 'ins_3',
        insumoNombre: 'Hidróxido de Sodio 99%',
        cantidad: 2.0,
        unidad: 'kg',
        costoUnitario: 22.0,
        total: 44.0,
        numeroComprobante: 'FAC-003-1205',
        estado: 'Recibida',
        notas: 'En escamas secas, lote fresco.',
      },
      {
        id: 'cmp_4',
        codigo: 'CMP-1043',
        fecha: '2026-11-06',
        proveedorId: 'prov_4',
        proveedorNombre: 'Empaques Ecológicos Lima',
        insumoId: 'ins_6',
        insumoNombre: 'Cajas de Cartón Kraft 100g',
        cantidad: 200,
        unidad: 'unidades',
        costoUnitario: 0.85,
        total: 170.0,
        numeroComprobante: 'FAC-001-9941',
        estado: 'Pendiente',
        notas: 'Llega el lunes por courier local.',
      },
    ]);

    this.proveedores.set([
      {
        id: 'prov_1',
        codigo: 'PRV-001',
        nombre: 'Botánica Andina SAC',
        categoria: 'Aceites vegetales y extractos',
        contacto: 'Carlos Méndez',
        telefono: '+51 984 123 456',
        email: 'ventas@botanicaandina.pe',
        ciudad: 'Lima / San Isidro',
        valoracion: 5,
        totalCompras: 14,
        gastoTotal: 1280.0,
        estado: 'Activo',
        color: 'emerald',
        iniciales: 'BA',
        ultimaCompra: '07 nov 2026',
      },
      {
        id: 'prov_2',
        codigo: 'PRV-002',
        nombre: 'Esencias del Valle',
        categoria: 'Mantecas puras y ceras',
        contacto: 'Mariana Flores',
        telefono: '+51 972 555 120',
        email: 'contacto@esenciasvalle.com',
        ciudad: 'Arequipa',
        valoracion: 4,
        totalCompras: 8,
        gastoTotal: 720.0,
        estado: 'Activo',
        color: 'amber',
        iniciales: 'EV',
        ultimaCompra: '24 oct 2026',
      },
      {
        id: 'prov_3',
        codigo: 'PRV-003',
        nombre: 'Química Natural Perú',
        categoria: 'Reactivos puros y álcalis',
        contacto: 'Ing. Jorge Huamán',
        telefono: '+51 991 888 333',
        email: 'laboratorio@quimicanatural.pe',
        ciudad: 'Lima / Cercado',
        valoracion: 5,
        totalCompras: 6,
        gastoTotal: 340.0,
        estado: 'Activo',
        color: 'violet',
        iniciales: 'QN',
        ultimaCompra: '18 oct 2026',
      },
      {
        id: 'prov_4',
        codigo: 'PRV-004',
        nombre: 'Empaques Ecológicos Lima',
        categoria: 'Cajas kraft, fajas y etiquetas',
        contacto: 'Luciana Salazar',
        telefono: '+51 960 341 890',
        email: 'pedidos@empaqueseco.pe',
        ciudad: 'Lima / Surquillo',
        valoracion: 4,
        totalCompras: 5,
        gastoTotal: 490.0,
        estado: 'Activo',
        color: 'purple',
        iniciales: 'EE',
        ultimaCompra: '06 nov 2026',
      },
    ]);

    this.pedidos.set([
      {
        id: 'ped_1',
        codigo: 'PED-1048',
        clienteId: 'cli_1',
        clienteNombre: 'Rocío Nuñez Kikushima',
        fecha: 'Hoy, 10:42',
        canal: 'Tienda web',
        metodoPago: 'Yape / Plin',
        items: [
          { productoId: 'prod_1', productoNombre: 'Lavanda & Avena Calmante', cantidad: 2, precioUnitario: 28.0, subtotal: 56.0 },
          { productoId: 'prod_2', productoNombre: 'Miel de la Mañana', cantidad: 1, precioUnitario: 32.0, subtotal: 32.0 },
        ],
        itemsResumen: 'Set Ritual Lavanda & Miel (3 barras)',
        total: 88.0,
        estado: 'Por preparar',
        color: 'amber',
        direccionEntrega: 'Av. Dos de Mayo 840, Miraflores',
        notas: 'Para regalo, incluir tarjeta botánica.',
      },
      {
        id: 'ped_2',
        codigo: 'PED-1047',
        clienteId: 'cli_2',
        clienteNombre: 'Lucía Mendoza Alarcón',
        fecha: 'Hoy, 09:18',
        canal: 'WhatsApp / Feria',
        metodoPago: 'Transferencia BCP/BBVA',
        items: [
          { productoId: 'prod_4', productoNombre: 'Rosa Mosqueta & Arcilla', cantidad: 2, precioUnitario: 36.0, subtotal: 72.0 },
          { productoId: 'prod_3', productoNombre: 'Cítrico Botánico', cantidad: 1, precioUnitario: 30.0, subtotal: 30.0 },
        ],
        itemsResumen: '2x Rosa Mosqueta + 1x Cítrico Botánico',
        total: 102.0,
        estado: 'Listo para envío',
        color: 'blue',
        direccionEntrega: 'Calle Los Sauces 142, San Borja',
        notas: 'Enviar por motorizado en la tarde.',
      },
      {
        id: 'ped_3',
        codigo: 'PED-1046',
        clienteId: 'cli_3',
        clienteNombre: 'Valeria Soto Barreda',
        fecha: 'Ayer, 16:30',
        canal: 'Instagram',
        metodoPago: 'Yape / Plin',
        items: [
          { productoId: 'prod_2', productoNombre: 'Miel de la Mañana', cantidad: 1, precioUnitario: 32.0, subtotal: 32.0 },
        ],
        itemsResumen: '1x Miel de la Mañana & Propóleo',
        total: 32.0,
        estado: 'Entregado',
        color: 'green',
        direccionEntrega: 'Av. El Sol 310, Barranco',
        notas: 'Clienta satisfecha, primera compra.',
      },
      {
        id: 'ped_4',
        codigo: 'PED-1045',
        clienteId: 'cli_4',
        clienteNombre: 'Carolina Paz Seminario',
        fecha: '05 nov 2026',
        canal: 'Taller / Presencial',
        metodoPago: 'Efectivo',
        items: [
          { productoId: 'prod_1', productoNombre: 'Lavanda & Avena', cantidad: 4, precioUnitario: 28.0, subtotal: 112.0 },
        ],
        itemsResumen: 'Pack Bienestar 4x Lavanda & Avena',
        total: 112.0,
        estado: 'Entregado',
        color: 'green',
        direccionEntrega: 'Recogido en Taller SoapyFUN',
        notas: 'Alumna del taller presencial de formulación.',
      },
    ]);

    this.clientes.set([
      {
        id: 'cli_1',
        codigo: 'CLI-001',
        nombre: 'Rocío Nuñez Kikushima',
        email: 'rocio.nunez@soapyfun.local',
        telefono: '+51 989 332 110',
        segmento: 'Frecuente',
        ciudad: 'Lima / Miraflores',
        totalPedidos: 6,
        gastoTotal: 468.0,
        ultimaCompra: 'Hoy',
        iniciales: 'RN',
        color: 'purple',
        notas: 'Prefiere aromas florales y barras sin colorantes sintéticos.',
      },
      {
        id: 'cli_2',
        codigo: 'CLI-002',
        nombre: 'Lucía Mendoza Alarcón',
        email: 'lucia.mendoza@gmail.com',
        telefono: '+51 993 445 102',
        segmento: 'Frecuente',
        ciudad: 'Lima / San Borja',
        totalPedidos: 4,
        gastoTotal: 342.0,
        ultimaCompra: 'Hoy',
        iniciales: 'LM',
        color: 'violet',
        notas: 'Amante de la rosa mosqueta y arcilla rosa.',
      },
      {
        id: 'cli_3',
        codigo: 'CLI-003',
        nombre: 'Valeria Soto Barreda',
        email: 'valeria.soto@outlook.com',
        telefono: '+51 941 772 388',
        segmento: 'Nueva',
        ciudad: 'Lima / Barranco',
        totalPedidos: 1,
        gastoTotal: 32.0,
        ultimaCompra: 'Ayer',
        iniciales: 'VS',
        color: 'amber',
        notas: 'Nos conoció por reels de Instagram.',
      },
      {
        id: 'cli_4',
        codigo: 'CLI-004',
        nombre: 'Carolina Paz Seminario',
        email: 'carolina.paz@empresa.pe',
        telefono: '+51 955 889 214',
        segmento: 'Mayorista',
        ciudad: 'Lima / San Isidro',
        totalPedidos: 3,
        gastoTotal: 680.0,
        ultimaCompra: '05 nov 2026',
        iniciales: 'CP',
        color: 'emerald',
        notas: 'Solicita pedidos corporativos para fin de año.',
      },
    ]);

    this.facturas.set([
      {
        id: 'fac_1',
        numero: 'BOR-2026-0048',
        tipo: 'Borrador comercial',
        clienteId: 'cli_1',
        clienteNombre: 'Rocío Nuñez Kikushima',
        clienteDocumento: 'DNI 42891024',
        fechaEmision: '2026-11-07',
        fechaVencimiento: '2026-11-14',
        subtotal: 74.58,
        igv: 13.42,
        total: 88.0,
        estado: 'Pendiente',
        conceptoResumen: 'Set Ritual Lavanda & Miel (3 barras botánicas)',
        pedidoCodigo: 'PED-1048',
      },
      {
        id: 'fac_2',
        numero: 'BOR-2026-0047',
        tipo: 'Borrador comercial',
        clienteId: 'cli_2',
        clienteNombre: 'Lucía Mendoza Alarcón',
        clienteDocumento: 'DNI 09483321',
        fechaEmision: '2026-11-07',
        fechaVencimiento: '2026-11-14',
        subtotal: 86.44,
        igv: 15.56,
        total: 102.0,
        estado: 'Pendiente',
        conceptoResumen: '2x Rosa Mosqueta + 1x Cítrico Botánico',
        pedidoCodigo: 'PED-1047',
      },
      {
        id: 'fac_3',
        numero: 'BOL-2026-0036',
        tipo: 'Boleta preliminar',
        clienteId: 'cli_3',
        clienteNombre: 'Valeria Soto Barreda',
        clienteDocumento: 'DNI 72418902',
        fechaEmision: '2026-11-06',
        fechaVencimiento: '2026-11-06',
        subtotal: 27.12,
        igv: 4.88,
        total: 32.0,
        estado: 'Pagado',
        conceptoResumen: '1x Miel de la Mañana & Propóleo',
        pedidoCodigo: 'PED-1046',
      },
      {
        id: 'fac_4',
        numero: 'FAC-2026-0012',
        tipo: 'Factura preliminar',
        clienteId: 'cli_4',
        clienteNombre: 'Carolina Paz Seminario (Inversiones Paz EIRL)',
        clienteDocumento: 'RUC 20608933211',
        fechaEmision: '2026-11-05',
        fechaVencimiento: '2026-11-20',
        subtotal: 94.92,
        igv: 17.08,
        total: 112.0,
        estado: 'Pagado',
        conceptoResumen: 'Pack Bienestar 4x Jabón Lavanda & Avena',
        pedidoCodigo: 'PED-1045',
      },
    ]);

    this.usuarios.set([
      {
        id: 'usr_1',
        nombre: 'Rocío Nuñez Kikushima',
        email: 'admin@soapyfun.local',
        rol: 'Administradora',
        activo: true,
        fechaRegistro: '2026-10-01',
        ultimoAcceso: 'Hoy, 22:15',
        iniciales: 'RN',
      },
      {
        id: 'usr_2',
        nombre: 'Camila Torres Vega',
        email: 'camila.torres@soapyfun.local',
        rol: 'Asistente de Producción',
        activo: true,
        fechaRegistro: '2026-10-10',
        ultimoAcceso: 'Hoy, 18:30',
        iniciales: 'CT',
      },
      {
        id: 'usr_3',
        nombre: 'Andrea Paredes Luján',
        email: 'andrea.paredes@soapyfun.local',
        rol: 'Operaria de Taller',
        activo: true,
        fechaRegistro: '2026-10-18',
        ultimoAcceso: 'Ayer, 16:45',
        iniciales: 'AP',
      },
      {
        id: 'usr_4',
        nombre: 'Daniela Flores Cruz',
        email: 'daniela.ventas@soapyfun.local',
        rol: 'Vendedora',
        activo: false,
        fechaRegistro: '2026-10-22',
        ultimoAcceso: 'Hace 5 días',
        iniciales: 'DF',
      },
    ]);

    this.guardarDatos();
  }
}
