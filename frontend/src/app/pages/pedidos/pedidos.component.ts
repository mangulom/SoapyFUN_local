import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Pedido, PedidoItem } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'soapy-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">VENTAS Y CUMPLIMIENTO</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Gestión de Pedidos</h1>
          <p class="text-xs text-slate-500 mt-1">Monitorea órdenes de venta desde la tienda online, ferias, WhatsApp o Instagram hasta su entrega.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Crear Pedido
          </button>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Facturado</span>
          <b class="text-2xl font-black text-purple-900">S/ {{ totalVentas().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">En órdenes no canceladas</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por Preparar</span>
          <b class="text-2xl font-black text-amber-600">{{ contarEstado('Por preparar') }}</b>
          <span class="text-[10px] text-slate-500">En empaque de taller</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listos para Envío</span>
          <b class="text-2xl font-black text-blue-600">{{ contarEstado('Listo para envío') }}</b>
          <span class="text-[10px] text-slate-500">Esperando courier / motorizado</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entregados</span>
          <b class="text-2xl font-black text-emerald-600">{{ contarEstado('Entregado') }}</b>
          <span class="text-[10px] text-slate-500">Completados con éxito</span>
        </div>
      </div>

      <!-- Barra de Filtros -->
      <div class="p-4 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div class="relative flex-1 max-w-md">
            <span class="absolute left-3 top-2.5 text-slate-400 text-sm">⌕</span>
            <input
              type="text"
              [(ngModel)]="filtroTexto"
              placeholder="Buscar por código (PED-...), cliente o producto..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select [(ngModel)]="filtroEstado" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los estados</option>
            <option value="Por preparar">Por preparar</option>
            <option value="Listo para envío">Listo para envío</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <select [(ngModel)]="filtroCanal" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los canales</option>
            <option value="Tienda web">Tienda web</option>
            <option value="WhatsApp / Feria">WhatsApp / Feria</option>
            <option value="Instagram">Instagram</option>
            <option value="Taller / Presencial">Taller / Presencial</option>
          </select>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ pedidosFiltrados().length }}</b> pedidos
        </div>
      </div>

      <!-- Tabla CRUD -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('codigo')">
                  PEDIDO {{ iconoOrden('codigo') }}
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('clienteNombre')">
                  CLIENTE {{ iconoOrden('clienteNombre') }}
                </th>
                <th class="py-3.5 px-4">PRODUCTOS & RESUMEN</th>
                <th class="py-3.5 px-4">CANAL</th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700 text-right" (click)="cambiarOrden('total')">
                  TOTAL (S/) {{ iconoOrden('total') }}
                </th>
                <th class="py-3.5 px-4 text-center">PAGO</th>
                <th class="py-3.5 px-4 text-center">ESTADO</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (pedido of pedidosPaginados(); track pedido.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-purple-800">{{ pedido.codigo }}</td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-850">{{ pedido.clienteNombre }}</div>
                    <div class="text-[10px] text-slate-400">{{ pedido.fecha }}</div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-medium text-slate-800">{{ pedido.itemsResumen }}</div>
                    @if (pedido.direccionEntrega) {
                      <div class="text-[10px] text-slate-400 truncate max-w-[200px]" [title]="pedido.direccionEntrega">
                        📍 {{ pedido.direccionEntrega }}
                      </div>
                    }
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      {{ pedido.canal }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right font-black text-sm text-purple-900">
                    S/ {{ pedido.total.toFixed(2) }}
                  </td>
                  <td class="py-3 px-4 text-center text-[10px] text-slate-500">
                    {{ pedido.metodoPago }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <button
                      (click)="alternarEstadoRapido(pedido)"
                      class="pill cursor-pointer transition-transform hover:scale-105"
                      [ngClass]="{
                        'pill-amber': pedido.estado === 'Por preparar',
                        'pill-blue': pedido.estado === 'Listo para envío',
                        'pill-green': pedido.estado === 'Entregado',
                        'pill-red': pedido.estado === 'Cancelado'
                      }"
                      title="Clic para avanzar estado"
                    >
                      {{ pedido.estado }} ↷
                    </button>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="verTicket(pedido)" class="action-btn text-purple-700 hover:bg-purple-50" title="Ver ticket / detalle">
                        📄
                      </button>
                      <button (click)="abrirModalEditar(pedido)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar pedido">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(pedido)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar pedido">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">🛍️</div>
                    <div class="font-medium text-sm text-slate-600">No se encontraron pedidos</div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
          <div class="flex items-center gap-2">
            <span>Mostrar</span>
            <select [(ngModel)]="elementosPorPagina" class="border border-slate-200 rounded-lg px-2 py-1 bg-white">
              <option [value]="5">5</option>
              <option [value]="10">10</option>
              <option [value]="20">20</option>
            </select>
          </div>
          <div class="flex items-center gap-1">
            <button (click)="paginaActual.set(paginaActual() - 1)" [disabled]="paginaActual() === 1" class="page-btn">‹</button>
            <span class="px-2">Página <b>{{ paginaActual() }}</b> de {{ totalPaginas() || 1 }}</span>
            <button (click)="paginaActual.set(paginaActual() + 1)" [disabled]="paginaActual() >= totalPaginas()" class="page-btn">›</button>
          </div>
        </div>
      </div>

      <!-- Modal Crear / Editar -->
      <soapy-crud-modal
        [isOpen]="modalAbierto"
        [title]="editando ? 'Editar Pedido' : 'Crear Pedido de Tienda'"
        [subtitle]="'Reserva stock de productos y actualiza el historial de compra de la clienta'"
        [eyebrow]="'VENTAS'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarPedido()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Cliente *</label>
              <select [(ngModel)]="formClienteId" (ngModelChange)="alSeleccionarCliente($event)" name="cliente" required class="form-input bg-white">
                <option value="">Selecciona una clienta...</option>
                @for (c of dataService.clientes(); track c.id) {
                  <option [value]="c.id">{{ c.nombre }} ({{ c.segmento }})</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Canal de Venta *</label>
              <select [(ngModel)]="formCanal" name="canal" class="form-input bg-white">
                <option value="Tienda web">Tienda web (Online)</option>
                <option value="WhatsApp / Feria">WhatsApp / Feria</option>
                <option value="Instagram">Instagram (DM)</option>
                <option value="Taller / Presencial">Taller / Presencial</option>
              </select>
            </div>
          </div>

          <!-- Selección de Producto -->
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">PRODUCTO PRINCIPAL</span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="form-label">Jabón / Set *</label>
                <select [(ngModel)]="formProductoId" (ngModelChange)="alSeleccionarProducto($event)" name="producto" required class="form-input bg-white">
                  <option value="">Selecciona un producto...</option>
                  @for (prod of dataService.productos(); track prod.id) {
                    <option [value]="prod.id" [disabled]="prod.stock <= 0">
                      {{ prod.nombre }} — S/ {{ prod.precio.toFixed(2) }} (Disponibles: {{ prod.stock }})
                    </option>
                  }
                </select>
              </div>
              <div>
                <label class="form-label">Cantidad *</label>
                <input type="number" min="1" [max]="maxStockPermitido" [(ngModel)]="formCantidad" name="cantidad" required class="form-input" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Método de Pago *</label>
              <select [(ngModel)]="formMetodoPago" name="metodoPago" class="form-input bg-white">
                <option value="Yape / Plin">Yape / Plin</option>
                <option value="Transferencia BCP/BBVA">Transferencia BCP/BBVA</option>
                <option value="Efectivo">Efectivo contraentrega</option>
                <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
              </select>
            </div>
            <div>
              <label class="form-label">Estado Inicial *</label>
              <select [(ngModel)]="formEstado" name="estado" class="form-input bg-white">
                <option value="Por preparar">Por preparar (En taller)</option>
                <option value="Listo para envío">Listo para envío</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div class="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
            <span class="text-purple-800 font-semibold">Total a cobrar:</span>
            <b class="text-base text-purple-950 font-black">S/ {{ totalCalculadoModal() }}</b>
          </div>

          <div>
            <label class="form-label">Dirección de Entrega</label>
            <input type="text" [(ngModel)]="formDireccionEntrega" name="direccion" placeholder="Calle, número, distrito y referencias..." class="form-input" />
          </div>

          <div>
            <label class="form-label">Notas del Pedido</label>
            <textarea [(ngModel)]="formNotas" name="notas" rows="2" placeholder="Empaque de regalo, dedicatoria, etc..." class="form-input"></textarea>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar Cambios' : 'Registrar Pedido' }}</button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal de Ticket / Detalle -->
      <soapy-crud-modal
        [isOpen]="ticketAbierto"
        title="Ticket de Venta SoapyFUN"
        [subtitle]="'Orden: ' + (pedidoTicket?.codigo || '')"
        [eyebrow]="'COMPROBANTE'"
        (close)="ticketAbierto = false"
      >
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs space-y-3">
          <div class="text-center pb-2 border-b border-dashed border-slate-300">
            <b class="text-sm">SOAPYFUN JABONERÍA ARTESANAL</b>
            <div class="text-[10px] text-slate-500">Rocío Nuñez Kikushima · Lima, Perú</div>
            <div class="text-[10px] text-slate-500">Orden: {{ pedidoTicket?.codigo }} · {{ pedidoTicket?.fecha }}</div>
          </div>

          <div class="space-y-1">
            <div><b>Cliente:</b> {{ pedidoTicket?.clienteNombre }}</div>
            <div><b>Canal:</b> {{ pedidoTicket?.canal }}</div>
            <div><b>Pago:</b> {{ pedidoTicket?.metodoPago }}</div>
            @if (pedidoTicket?.direccionEntrega) {
              <div><b>Entrega:</b> {{ pedidoTicket?.direccionEntrega }}</div>
            }
          </div>

          <div class="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
            @for (it of pedidoTicket?.items; track it.productoId) {
              <div class="flex justify-between">
                <span>{{ it.cantidad }}x {{ it.productoNombre }}</span>
                <b>S/ {{ it.subtotal.toFixed(2) }}</b>
              </div>
            } @empty {
              <div class="flex justify-between">
                <span>{{ pedidoTicket?.itemsResumen }}</span>
                <b>S/ {{ pedidoTicket?.total?.toFixed(2) }}</b>
              </div>
            }
          </div>

          <div class="flex justify-between text-sm font-bold pt-1">
            <span>TOTAL PAGADO:</span>
            <span>S/ {{ pedidoTicket?.total?.toFixed(2) }}</span>
          </div>

          <div class="text-center pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300">
            ¡Gracias por apoyar la jabonería artesanal botánica! 🧼🌿
          </div>
        </div>

        <div class="pt-4 flex justify-end">
          <button type="button" (click)="ticketAbierto = false" class="btn-primary">Cerrar Ticket</button>
        </div>
      </soapy-crud-modal>

      <!-- Modal Confirmar Eliminación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Cancelar / Eliminar pedido?"
        [message]="mensajeConfirmarEliminar"
        confirmText="Sí, eliminar"
        (confirm)="eliminarConfirmado()"
        (cancel)="confirmarAbierto = false"
      ></soapy-confirm-dialog>
    </div>
  `,
  styles: [`
    .crud-page { font-family: Roboto, Inter, system-ui, sans-serif; }
    .stat-card {
      background: white; padding: 14px 16px; border-radius: 14px;
      border: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 4px;
    }
    .btn-primary {
      background: #facc15; color: #3b0764; font-weight: 700; font-size: 12px;
      padding: 9px 16px; border-radius: 10px; border: 0; cursor: pointer;
    }
    .btn-primary:hover { background: #eab308; }
    .btn-secondary {
      background: white; color: #475569; font-weight: 600; font-size: 12px;
      padding: 9px 14px; border-radius: 10px; border: 1px solid #e2e8f0; cursor: pointer;
    }
    .btn-secondary:hover { background: #f8fafc; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; border: 0; }
    .pill-amber { background: #fef3c7; color: #b45309; }
    .pill-blue { background: #dbeafe; color: #1e40af; }
    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-red { background: #fee2e2; color: #b91c1c; }
    .action-btn { width: 28px; height: 28px; border-radius: 8px; border: 0; display: inline-grid; place-items: center; cursor: pointer; }
    .page-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: inline-grid; place-items: center; font-weight: bold; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .form-label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .form-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #7c3aed; }
  `]
})
export class PedidosComponent {
  readonly dataService = inject(CrudDataService);

  filtroTexto = '';
  filtroEstado = 'Todos';
  filtroCanal = 'Todos';

  columnaOrden = 'codigo';
  ordenAscendente = false; // Más recientes primero

  paginaActual = signal(1);
  elementosPorPagina = 10;

  modalAbierto = false;
  ticketAbierto = false;
  confirmarAbierto = false;
  editando = false;
  pedidoSeleccionadoId = '';
  pedidoAEliminar: Pedido | null = null;

  get mensajeConfirmarEliminar(): string {
    return '¿Estás segura de eliminar el pedido ' + (this.pedidoAEliminar?.codigo || '') + ' de ' + (this.pedidoAEliminar?.clienteNombre || '') + '?';
  }
  pedidoTicket: Pedido | null = null;

  formClienteId = '';
  formClienteNombre = '';
  formCanal: Pedido['canal'] = 'Tienda web';
  formProductoId = '';
  formProductoNombre = '';
  formPrecioUnitario = 28.0;
  formCantidad = 1;
  maxStockPermitido = 100;
  formMetodoPago: Pedido['metodoPago'] = 'Yape / Plin';
  formEstado: Pedido['estado'] = 'Por preparar';
  formDireccionEntrega = '';
  formNotas = '';

  readonly totalVentas = computed(() => {
    return this.dataService.pedidos()
      .filter((p) => p.estado !== 'Cancelado')
      .reduce((acc, p) => acc + p.total, 0);
  });

  contarEstado(estado: string): number {
    return this.dataService.pedidos().filter((p) => p.estado === estado).length;
  }

  readonly totalCalculadoModal = computed(() => {
    return (Number(this.formCantidad || 1) * Number(this.formPrecioUnitario || 0)).toFixed(2);
  });

  readonly pedidosFiltrados = computed(() => {
    let lista = this.dataService.pedidos();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (p) =>
          p.codigo.toLowerCase().includes(query) ||
          p.clienteNombre.toLowerCase().includes(query) ||
          p.itemsResumen.toLowerCase().includes(query)
      );
    }

    if (this.filtroEstado !== 'Todos') {
      lista = lista.filter((p) => p.estado === this.filtroEstado);
    }

    if (this.filtroCanal !== 'Todos') {
      lista = lista.filter((p) => p.canal === this.filtroCanal);
    }

    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Pedido] ?? '';
      let valB: any = b[this.columnaOrden as keyof Pedido] ?? '';
      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? valA - valB : valB - valA;
    });
  });

  readonly totalPaginas = computed(() => Math.ceil(this.pedidosFiltrados().length / this.elementosPorPagina));
  readonly pedidosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.pedidosFiltrados().slice(inicio, inicio + this.elementosPorPagina);
  });

  cambiarOrden(columna: string): void {
    if (this.columnaOrden === columna) this.ordenAscendente = !this.ordenAscendente;
    else { this.columnaOrden = columna; this.ordenAscendente = true; }
  }

  iconoOrden(columna: string): string {
    if (this.columnaOrden !== columna) return '↕';
    return this.ordenAscendente ? '↑' : '↓';
  }

  alSeleccionarCliente(id: string): void {
    const cli = this.dataService.clientes().find((c) => c.id === id);
    if (cli) {
      this.formClienteNombre = cli.nombre;
    }
  }

  alSeleccionarProducto(id: string): void {
    const prod = this.dataService.productos().find((p) => p.id === id);
    if (prod) {
      this.formProductoNombre = prod.nombre;
      this.formPrecioUnitario = prod.precio;
      this.maxStockPermitido = prod.stock;
      if (this.formCantidad > prod.stock) {
        this.formCantidad = Math.max(1, prod.stock);
      }
    }
  }

  alternarEstadoRapido(pedido: Pedido): void {
    const estados: Pedido['estado'][] = ['Por preparar', 'Listo para envío', 'Entregado'];
    const actualIdx = estados.indexOf(pedido.estado);
    const siguiente = actualIdx >= 0 && actualIdx < estados.length - 1 ? estados[actualIdx + 1] : 'Por preparar';
    this.dataService.actualizarEstadoPedido(pedido.id, siguiente);
  }

  abrirModalCrear(): void {
    this.editando = false;
    this.pedidoSeleccionadoId = '';
    const clientes = this.dataService.clientes();
    const prods = this.dataService.productos();

    this.formClienteId = clientes[0]?.id || '';
    this.formClienteNombre = clientes[0]?.nombre || '';
    this.formProductoId = prods[0]?.id || '';
    this.formProductoNombre = prods[0]?.nombre || '';
    this.formPrecioUnitario = prods[0]?.precio || 28.0;
    this.maxStockPermitido = prods[0]?.stock || 20;
    this.formCantidad = 1;
    this.formCanal = 'Tienda web';
    this.formMetodoPago = 'Yape / Plin';
    this.formEstado = 'Por preparar';
    this.formDireccionEntrega = '';
    this.formNotas = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(pedido: Pedido): void {
    this.editando = true;
    this.pedidoSeleccionadoId = pedido.id;
    this.formClienteId = pedido.clienteId;
    this.formClienteNombre = pedido.clienteNombre;
    this.formCanal = pedido.canal;
    this.formMetodoPago = pedido.metodoPago;
    this.formEstado = pedido.estado;
    this.formDireccionEntrega = pedido.direccionEntrega || '';
    this.formNotas = pedido.notas || '';

    if (pedido.items && pedido.items[0]) {
      this.formProductoId = pedido.items[0].productoId;
      this.formProductoNombre = pedido.items[0].productoNombre;
      this.formCantidad = pedido.items[0].cantidad;
      this.formPrecioUnitario = pedido.items[0].precioUnitario;
    }
    this.modalAbierto = true;
  }

  guardarPedido(): void {
    if (!this.formClienteNombre || !this.formProductoNombre) return;

    const subtotal = Number(this.formCantidad) * Number(this.formPrecioUnitario);
    const item: PedidoItem = {
      productoId: this.formProductoId,
      productoNombre: this.formProductoNombre,
      cantidad: Number(this.formCantidad),
      precioUnitario: Number(this.formPrecioUnitario),
      subtotal,
    };

    if (this.editando) {
      this.dataService.actualizarPedido(this.pedidoSeleccionadoId, {
        clienteId: this.formClienteId,
        clienteNombre: this.formClienteNombre,
        canal: this.formCanal,
        metodoPago: this.formMetodoPago,
        estado: this.formEstado,
        direccionEntrega: this.formDireccionEntrega.trim(),
        notas: this.formNotas.trim(),
        total: subtotal,
        items: [item],
        itemsResumen: `${this.formCantidad}x ${this.formProductoNombre}`,
      });
    } else {
      this.dataService.crearPedido({
        clienteId: this.formClienteId,
        clienteNombre: this.formClienteNombre,
        canal: this.formCanal,
        metodoPago: this.formMetodoPago,
        estado: this.formEstado,
        direccionEntrega: this.formDireccionEntrega.trim(),
        notas: this.formNotas.trim(),
        total: subtotal,
        items: [item],
        itemsResumen: `${this.formCantidad}x ${this.formProductoNombre}`,
      });
    }
    this.modalAbierto = false;
  }

  verTicket(pedido: Pedido): void {
    this.pedidoTicket = pedido;
    this.ticketAbierto = true;
  }

  confirmarEliminar(ped: Pedido): void {
    this.pedidoAEliminar = ped;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.pedidoAEliminar) {
      this.dataService.eliminarPedido(this.pedidoAEliminar.id);
      this.pedidoAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Pedido', 'Cliente', 'Productos', 'Canal', 'Fecha', 'Total S/', 'Pago', 'Estado', 'Dirección'];
    const filas = this.dataService.pedidos().map((p) => [
      p.codigo,
      p.clienteNombre,
      p.itemsResumen,
      p.canal,
      p.fecha,
      p.total.toFixed(2),
      p.metodoPago,
      p.estado,
      p.direccionEntrega || '',
    ]);
    this.dataService.exportarCsv('pedidos_soapyfun', columnas, filas);
  }
}
