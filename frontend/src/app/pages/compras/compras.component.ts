import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Compra } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'soapy-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">ABASTECIMIENTO Y ENTRADAS</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Órdenes de Compra</h1>
          <p class="text-xs text-slate-500 mt-1">Registra compras de materias primas a proveedores para actualizar existencias y costos unitarios automáticamente.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Registrar Compra
          </button>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Comprado</span>
          <b class="text-2xl font-black text-purple-900">S/ {{ totalGastoCompras().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">Inversión en materias primas</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Órdenes Recibidas</span>
          <b class="text-2xl font-black text-emerald-600">{{ contarEstado('Recibida') }}</b>
          <span class="text-[10px] text-slate-500">Ingresadas a taller</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Órdenes en Camino</span>
          <b class="text-2xl font-black text-amber-600">{{ contarEstado('Pendiente') }}</b>
          <span class="text-[10px] text-slate-500">Por recibir en almacén</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedores</span>
          <b class="text-2xl font-black text-blue-600">{{ dataService.proveedores().length }}</b>
          <span class="text-[10px] text-slate-500">Aliados comerciales</span>
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
              placeholder="Buscar por código, proveedor, insumo o factura..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select [(ngModel)]="filtroEstado" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los estados</option>
            <option value="Recibida">Recibidas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Cancelada">Canceladas</option>
          </select>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ comprasFiltradas().length }}</b> órdenes
        </div>
      </div>

      <!-- Tabla CRUD -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('codigo')">
                  ORDEN {{ iconoOrden('codigo') }}
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('fecha')">
                  FECHA {{ iconoOrden('fecha') }}
                </th>
                <th class="py-3.5 px-4">PROVEEDOR</th>
                <th class="py-3.5 px-4">INSUMO ADQUIRIDO</th>
                <th class="py-3.5 px-4 text-center">CANTIDAD</th>
                <th class="py-3.5 px-4 text-right">COSTO UNIT.</th>
                <th class="py-3.5 px-4 text-right cursor-pointer hover:text-purple-700" (click)="cambiarOrden('total')">
                  TOTAL (S/) {{ iconoOrden('total') }}
                </th>
                <th class="py-3.5 px-4 text-center">ESTADO</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (compra of comprasPaginadas(); track compra.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-purple-800">{{ compra.codigo }}</td>
                  <td class="py-3 px-4 text-slate-500 whitespace-nowrap">{{ compra.fecha }}</td>
                  <td class="py-3 px-4 font-semibold text-slate-800">{{ compra.proveedorNombre }}</td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-800">{{ compra.insumoNombre }}</div>
                    @if (compra.numeroComprobante) {
                      <div class="text-[10px] text-slate-400">Doc: {{ compra.numeroComprobante }}</div>
                    }
                  </td>
                  <td class="py-3 px-4 text-center">
                    <b>{{ compra.cantidad }}</b> <span class="text-slate-400">{{ compra.unidad }}</span>
                  </td>
                  <td class="py-3 px-4 text-right text-slate-600">S/ {{ compra.costoUnitario.toFixed(2) }}</td>
                  <td class="py-3 px-4 text-right font-bold text-purple-900">S/ {{ compra.total.toFixed(2) }}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="pill" [ngClass]="{
                      'pill-green': compra.estado === 'Recibida',
                      'pill-amber': compra.estado === 'Pendiente',
                      'pill-red': compra.estado === 'Cancelada'
                    }">
                      {{ compra.estado }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="abrirModalEditar(compra)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar compra">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(compra)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar orden">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">📦</div>
                    <div class="font-medium text-sm text-slate-600">No hay compras registradas</div>
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
        [title]="editando ? 'Editar Orden de Compra' : 'Registrar Entrada de Compra'"
        [subtitle]="'Actualiza existencias y costo unitario promedio en almacén'"
        [eyebrow]="'ABASTECIMIENTO'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarCompra()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Proveedor *</label>
              <select [(ngModel)]="formProveedorId" (ngModelChange)="alSeleccionarProveedor($event)" name="proveedor" required class="form-input bg-white">
                <option value="">Selecciona un proveedor...</option>
                @for (p of dataService.proveedores(); track p.id) {
                  <option [value]="p.id">{{ p.nombre }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Insumo que Ingresa *</label>
              <select [(ngModel)]="formInsumoId" (ngModelChange)="alSeleccionarInsumo($event)" name="insumo" required class="form-input bg-white">
                <option value="">Selecciona un insumo...</option>
                @for (i of dataService.insumos(); track i.id) {
                  <option [value]="i.id">{{ i.nombre }} ({{ i.unidad }})</option>
                }
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Cantidad Adquirida *</label>
              <input type="number" min="0.01" step="0.01" [(ngModel)]="formCantidad" name="cantidad" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Unidad de Medida *</label>
              <input type="text" [(ngModel)]="formUnidad" name="unidad" required readonly class="form-input bg-slate-50 cursor-not-allowed" />
            </div>
            <div>
              <label class="form-label">Costo Unitario (S/) *</label>
              <input type="number" min="0.01" step="0.01" [(ngModel)]="formCostoUnitario" name="costoUnitario" required class="form-input" />
            </div>
          </div>

          <div class="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
            <span class="text-purple-800 font-semibold">Total a pagar:</span>
            <b class="text-base text-purple-950 font-black">S/ {{ totalCalculadoModal() }}</b>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Fecha de Compra *</label>
              <input type="date" [(ngModel)]="formFecha" name="fecha" required class="form-input" />
            </div>
            <div>
              <label class="form-label">N° Factura / Guía</label>
              <input type="text" [(ngModel)]="formNumeroComprobante" name="comprobante" placeholder="Ej: FAC-001-9482" class="form-input" />
            </div>
            <div>
              <label class="form-label">Estado de la Orden *</label>
              <select [(ngModel)]="formEstado" name="estado" class="form-input bg-white">
                <option value="Recibida">Recibida (Ingresar a almacén)</option>
                <option value="Pendiente">Pendiente (Por recibir)</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label">Notas Adicionales</label>
            <textarea [(ngModel)]="formNotas" name="notas" rows="2" placeholder="Observaciones de entrega o calidad..." class="form-input"></textarea>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar Cambios' : 'Registrar Compra' }}</button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal de Confirmación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Eliminar orden de compra?"
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
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-amber { background: #fef3c7; color: #b45309; }
    .pill-red { background: #fee2e2; color: #b91c1c; }
    .action-btn { width: 28px; height: 28px; border-radius: 8px; border: 0; display: inline-grid; place-items: center; cursor: pointer; }
    .page-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: inline-grid; place-items: center; font-weight: bold; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .form-label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .form-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #7c3aed; }
  `]
})
export class ComprasComponent {
  readonly dataService = inject(CrudDataService);

  filtroTexto = '';
  filtroEstado = 'Todos';

  columnaOrden = 'codigo';
  ordenAscendente = false; // Compras más recientes primero

  paginaActual = signal(1);
  elementosPorPagina = 10;

  modalAbierto = false;
  confirmarAbierto = false;
  editando = false;
  compraSeleccionadaId = '';
  compraAEliminar: Compra | null = null;

  get mensajeConfirmarEliminar(): string {
    return '¿Deseas eliminar la orden ' + (this.compraAEliminar?.codigo || '') + ' de ' + (this.compraAEliminar?.insumoNombre || '') + '?';
  }

  formProveedorId = '';
  formProveedorNombre = '';
  formInsumoId = '';
  formInsumoNombre = '';
  formCantidad = 1;
  formUnidad = 'kg';
  formCostoUnitario = 30.0;
  formFecha = new Date().toISOString().slice(0, 10);
  formNumeroComprobante = '';
  formEstado: Compra['estado'] = 'Recibida';
  formNotas = '';

  readonly totalGastoCompras = computed(() => {
    return this.dataService.compras()
      .filter((c) => c.estado !== 'Cancelada')
      .reduce((sum, c) => sum + c.total, 0);
  });

  contarEstado(estado: string): number {
    return this.dataService.compras().filter((c) => c.estado === estado).length;
  }

  readonly totalCalculadoModal = computed(() => {
    return (Number(this.formCantidad || 0) * Number(this.formCostoUnitario || 0)).toFixed(2);
  });

  readonly comprasFiltradas = computed(() => {
    let lista = this.dataService.compras();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (c) =>
          c.codigo.toLowerCase().includes(query) ||
          c.proveedorNombre.toLowerCase().includes(query) ||
          c.insumoNombre.toLowerCase().includes(query) ||
          c.numeroComprobante.toLowerCase().includes(query)
      );
    }

    if (this.filtroEstado !== 'Todos') {
      lista = lista.filter((c) => c.estado === this.filtroEstado);
    }

    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Compra] ?? '';
      let valB: any = b[this.columnaOrden as keyof Compra] ?? '';
      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? valA - valB : valB - valA;
    });
  });

  readonly totalPaginas = computed(() => Math.ceil(this.comprasFiltradas().length / this.elementosPorPagina));
  readonly comprasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.comprasFiltradas().slice(inicio, inicio + this.elementosPorPagina);
  });

  cambiarOrden(columna: string): void {
    if (this.columnaOrden === columna) this.ordenAscendente = !this.ordenAscendente;
    else { this.columnaOrden = columna; this.ordenAscendente = true; }
  }

  iconoOrden(columna: string): string {
    if (this.columnaOrden !== columna) return '↕';
    return this.ordenAscendente ? '↑' : '↓';
  }

  alSeleccionarProveedor(id: string): void {
    const prov = this.dataService.proveedores().find((p) => p.id === id);
    if (prov) {
      this.formProveedorNombre = prov.nombre;
    }
  }

  alSeleccionarInsumo(id: string): void {
    const ins = this.dataService.insumos().find((i) => i.id === id);
    if (ins) {
      this.formInsumoNombre = ins.nombre;
      this.formUnidad = ins.unidad;
      this.formCostoUnitario = ins.costoUnitario;
    }
  }

  abrirModalCrear(): void {
    this.editando = false;
    this.compraSeleccionadaId = '';
    const provs = this.dataService.proveedores();
    const insumos = this.dataService.insumos();

    this.formProveedorId = provs[0]?.id || '';
    this.formProveedorNombre = provs[0]?.nombre || '';
    this.formInsumoId = insumos[0]?.id || '';
    this.formInsumoNombre = insumos[0]?.nombre || '';
    this.formUnidad = insumos[0]?.unidad || 'kg';
    this.formCostoUnitario = insumos[0]?.costoUnitario || 35.0;
    this.formCantidad = 2;
    this.formFecha = new Date().toISOString().slice(0, 10);
    this.formNumeroComprobante = '';
    this.formEstado = 'Recibida';
    this.formNotas = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(compra: Compra): void {
    this.editando = true;
    this.compraSeleccionadaId = compra.id;
    this.formProveedorId = compra.proveedorId;
    this.formProveedorNombre = compra.proveedorNombre;
    this.formInsumoId = compra.insumoId;
    this.formInsumoNombre = compra.insumoNombre;
    this.formCantidad = compra.cantidad;
    this.formUnidad = compra.unidad;
    this.formCostoUnitario = compra.costoUnitario;
    this.formFecha = compra.fecha;
    this.formNumeroComprobante = compra.numeroComprobante;
    this.formEstado = compra.estado;
    this.formNotas = compra.notas || '';
    this.modalAbierto = true;
  }

  guardarCompra(): void {
    if (!this.formProveedorNombre || !this.formInsumoNombre) return;

    if (this.editando) {
      this.dataService.actualizarCompra(this.compraSeleccionadaId, {
        proveedorId: this.formProveedorId,
        proveedorNombre: this.formProveedorNombre,
        insumoId: this.formInsumoId,
        insumoNombre: this.formInsumoNombre,
        cantidad: Number(this.formCantidad),
        unidad: this.formUnidad,
        costoUnitario: Number(this.formCostoUnitario),
        fecha: this.formFecha,
        numeroComprobante: this.formNumeroComprobante.trim(),
        estado: this.formEstado,
        notas: this.formNotas.trim(),
      });
    } else {
      this.dataService.crearCompra({
        proveedorId: this.formProveedorId,
        proveedorNombre: this.formProveedorNombre,
        insumoId: this.formInsumoId,
        insumoNombre: this.formInsumoNombre,
        cantidad: Number(this.formCantidad),
        unidad: this.formUnidad,
        costoUnitario: Number(this.formCostoUnitario),
        fecha: this.formFecha,
        numeroComprobante: this.formNumeroComprobante.trim(),
        estado: this.formEstado,
        notas: this.formNotas.trim(),
      });
    }
    this.modalAbierto = false;
  }

  confirmarEliminar(cmp: Compra): void {
    this.compraAEliminar = cmp;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.compraAEliminar) {
      this.dataService.eliminarCompra(this.compraAEliminar.id);
      this.compraAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Orden', 'Fecha', 'Proveedor', 'Insumo', 'Cantidad', 'Unidad', 'Costo Unit. S/', 'Total S/', 'Comprobante', 'Estado'];
    const filas = this.dataService.compras().map((c) => [
      c.codigo,
      c.fecha,
      c.proveedorNombre,
      c.insumoNombre,
      c.cantidad,
      c.unidad,
      c.costoUnitario.toFixed(2),
      c.total.toFixed(2),
      c.numeroComprobante,
      c.estado,
    ]);
    this.dataService.exportarCsv('compras_soapyfun', columnas, filas);
  }
}
