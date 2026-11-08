import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Factura } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'soapy-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">DOCUMENTOS COMERCIALES</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Facturación y Cobranzas</h1>
          <p class="text-xs text-slate-500 mt-1">Genera borradores comerciales, notas de venta y concilia pagos de pedidos de jabonería.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Emitir Documento
          </button>
        </div>
      </div>

      <!-- Banner de advertencia fiscal Sunat -->
      <div class="p-3.5 mb-6 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <span class="text-base select-none mt-0.5">ℹ</span>
        <div class="leading-relaxed">
          <b>Nota sobre comprobantes fiscales en Perú:</b> Esta herramienta prepara borradores comerciales y notas de venta preliminares para conciliar pedidos. Para emisión de Boletas y Facturas electrónicas con validez tributaria ante SUNAT se requiere integración con PSE/OSE autorizado.
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Facturado</span>
          <b class="text-2xl font-black text-purple-900">S/ {{ totalFacturado().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">Documentos emitidos</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cobrado</span>
          <b class="text-2xl font-black text-emerald-600">S/ {{ totalCobrado().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">{{ contarEstado('Pagado') }} comprobantes saldados</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por Cobrar</span>
          <b class="text-2xl font-black text-amber-600">S/ {{ totalPorCobrar().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">{{ contarEstado('Pendiente') }} pendientes</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IGV Acumulado</span>
          <b class="text-2xl font-black text-blue-600">S/ {{ totalIgv().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">Tasa estándar 18%</span>
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
              placeholder="Buscar por número, cliente, DNI/RUC o concepto..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select [(ngModel)]="filtroTipo" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los tipos</option>
            <option value="Borrador comercial">Borrador comercial</option>
            <option value="Boleta preliminar">Boleta preliminar</option>
            <option value="Factura preliminar">Factura preliminar</option>
            <option value="Nota de venta">Nota de venta</option>
          </select>
          <select [(ngModel)]="filtroEstado" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Pagado">Pagado</option>
            <option value="Anulado">Anulado</option>
          </select>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ facturasFiltradas().length }}</b> documentos
        </div>
      </div>

      <!-- Tabla CRUD -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('numero')">
                  N° DOCUMENTO {{ iconoOrden('numero') }}
                </th>
                <th class="py-3.5 px-4">TIPO</th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('clienteNombre')">
                  CLIENTE / RAZÓN SOCIAL {{ iconoOrden('clienteNombre') }}
                </th>
                <th class="py-3.5 px-4">FECHAS (EMISIÓN / VENCE)</th>
                <th class="py-3.5 px-4 text-right">SUBTOTAL</th>
                <th class="py-3.5 px-4 text-right">IGV (18%)</th>
                <th class="py-3.5 px-4 text-right cursor-pointer hover:text-purple-700" (click)="cambiarOrden('total')">
                  TOTAL (S/) {{ iconoOrden('total') }}
                </th>
                <th class="py-3.5 px-4 text-center">ESTADO</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (fac of facturasPaginadas(); track fac.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-purple-800">{{ fac.numero }}</td>
                  <td class="py-3 px-4">
                    <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {{ fac.tipo }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-850">{{ fac.clienteNombre }}</div>
                    <div class="text-[10px] text-slate-400 font-mono">{{ fac.clienteDocumento }}</div>
                  </td>
                  <td class="py-3 px-4 text-slate-600">
                    <div>{{ fac.fechaEmision }}</div>
                    <div class="text-[10px] text-slate-400">Vence: {{ fac.fechaVencimiento }}</div>
                  </td>
                  <td class="py-3 px-4 text-right text-slate-600">S/ {{ fac.subtotal.toFixed(2) }}</td>
                  <td class="py-3 px-4 text-right text-slate-400">S/ {{ fac.igv.toFixed(2) }}</td>
                  <td class="py-3 px-4 text-right font-black text-sm text-purple-900">
                    S/ {{ fac.total.toFixed(2) }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <button
                      (click)="alternarEstadoPago(fac)"
                      class="pill cursor-pointer hover:scale-105 transition-transform"
                      [ngClass]="{
                        'pill-amber': fac.estado === 'Pendiente',
                        'pill-green': fac.estado === 'Pagado',
                        'pill-red': fac.estado === 'Anulado'
                      }"
                      title="Clic para cambiar estado de pago"
                    >
                      {{ fac.estado }}
                    </button>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="verVistaPrevia(fac)" class="action-btn text-purple-700 hover:bg-purple-50" title="Ver documento comercial">
                        👁
                      </button>
                      <button (click)="abrirModalEditar(fac)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar comprobante">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(fac)" class="action-btn text-rose-600 hover:bg-rose-50" title="Anular documento">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">🧾</div>
                    <div class="font-medium text-sm text-slate-600">No hay documentos registrados</div>
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
        [title]="editando ? 'Editar Documento' : 'Emitir Comprobante / Borrador'"
        [subtitle]="'Cálculo automático de Base Imponible e IGV (18%)'"
        [eyebrow]="'FACTURACIÓN'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarFactura()" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Tipo de Comprobante *</label>
              <select [(ngModel)]="formTipo" name="tipo" class="form-input bg-white">
                <option value="Borrador comercial">Borrador comercial (Proforma)</option>
                <option value="Boleta preliminar">Boleta preliminar (DNI)</option>
                <option value="Factura preliminar">Factura preliminar (RUC)</option>
                <option value="Nota de venta">Nota de venta interna</option>
              </select>
            </div>
            <div>
              <label class="form-label">Cliente *</label>
              <select [(ngModel)]="formClienteId" (ngModelChange)="alSeleccionarCliente($event)" name="cliente" required class="form-input bg-white">
                <option value="">Selecciona clienta...</option>
                @for (c of dataService.clientes(); track c.id) {
                  <option [value]="c.id">{{ c.nombre }}</option>
                }
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">DNI / RUC del Cliente *</label>
              <input type="text" [(ngModel)]="formClienteDocumento" name="doc" required placeholder="Ej: DNI 42891024 o RUC 2060..." class="form-input" />
            </div>
            <div>
              <label class="form-label">Concepto / Glosa *</label>
              <input type="text" [(ngModel)]="formConceptoResumen" name="concepto" required placeholder="Ej: 3x Jabones artesanales botánicos" class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Subtotal / Base (S/) *</label>
              <input type="number" min="0.10" step="0.10" [(ngModel)]="formSubtotal" name="subtotal" required class="form-input" />
            </div>
            <div>
              <label class="form-label">IGV 18% (S/)</label>
              <div class="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-bold">
                S/ {{ igvCalculadoModal() }}
              </div>
            </div>
            <div>
              <label class="form-label">Total a Cobrar</label>
              <div class="py-2.5 px-3 rounded-xl bg-purple-50 border border-purple-100 text-purple-950 text-xs font-bold font-mono">
                S/ {{ totalCalculadoModal() }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Fecha de Emisión *</label>
              <input type="date" [(ngModel)]="formFechaEmision" name="emision" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Fecha de Vencimiento *</label>
              <input type="date" [(ngModel)]="formFechaVencimiento" name="vence" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Estado de Pago *</label>
              <select [(ngModel)]="formEstado" name="estado" class="form-input bg-white">
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
                <option value="Anulado">Anulado</option>
              </select>
            </div>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar Cambios' : 'Emitir Comprobante' }}</button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal Vista Previa de Factura -->
      <soapy-crud-modal
        [isOpen]="vistaPreviaAbierta"
        title="Comprobante Comercial"
        [subtitle]="facVistaPrevia?.tipo + ' ' + facVistaPrevia?.numero"
        [eyebrow]="'SOAPYFUN STUDIO'"
        (close)="vistaPreviaAbierta = false"
      >
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-xs space-y-4 font-sans">
          <!-- Encabezado comprobante -->
          <div class="flex justify-between items-start pb-4 border-b border-slate-200">
            <div>
              <span class="text-xl font-black text-purple-950">Soapy<span class="text-amber-500">FUN</span></span>
              <div class="text-[10px] text-slate-500">Jabonería Artesanal & Botánica</div>
              <div class="text-[10px] text-slate-500">Rocío Nuñez Kikushima</div>
              <div class="text-[10px] text-slate-500">Lima, Perú</div>
            </div>
            <div class="p-3 border border-purple-200 rounded-xl bg-purple-50/50 text-right">
              <div class="font-extrabold text-purple-900 uppercase text-[11px]">{{ facVistaPrevia?.tipo }}</div>
              <div class="font-mono font-bold text-sm text-purple-950">{{ facVistaPrevia?.numero }}</div>
              <div class="text-[10px] text-slate-500 mt-1">Emisión: {{ facVistaPrevia?.fechaEmision }}</div>
            </div>
          </div>

          <!-- Datos del cliente -->
          <div class="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase">SEÑOR(A):</span>
              <div class="font-bold text-slate-800">{{ facVistaPrevia?.clienteNombre }}</div>
              <div class="font-mono text-slate-500">{{ facVistaPrevia?.clienteDocumento }}</div>
            </div>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase">CONDICIÓN DE PAGO:</span>
              <div class="font-bold text-slate-800">{{ facVistaPrevia?.estado }}</div>
              <div class="text-slate-500 text-[10px]">Vencimiento: {{ facVistaPrevia?.fechaVencimiento }}</div>
            </div>
          </div>

          <!-- Tabla de ítems -->
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase">
                <th class="py-2">DESCRIPCIÓN</th>
                <th class="py-2 text-right">IMPORTE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="py-3 text-slate-800 font-medium">{{ facVistaPrevia?.conceptoResumen }}</td>
                <td class="py-3 text-right font-mono font-bold">S/ {{ facVistaPrevia?.subtotal?.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totales -->
          <div class="border-t border-slate-200 pt-3 space-y-1 text-right">
            <div class="text-slate-500">Subtotal: <b class="font-mono text-slate-800">S/ {{ facVistaPrevia?.subtotal?.toFixed(2) }}</b></div>
            <div class="text-slate-500">IGV (18%): <b class="font-mono text-slate-800">S/ {{ facVistaPrevia?.igv?.toFixed(2) }}</b></div>
            <div class="text-base font-black text-purple-950 pt-1 border-t border-slate-100">
              TOTAL: <span class="font-mono">S/ {{ facVistaPrevia?.total?.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3">
          <button type="button" (click)="vistaPreviaAbierta = false" class="btn-primary">Cerrar</button>
        </div>
      </soapy-crud-modal>

      <!-- Modal de Confirmación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Anular documento comercial?"
        [message]="mensajeConfirmarEliminar"
        confirmText="Sí, anular"
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
export class FacturacionComponent {
  readonly dataService = inject(CrudDataService);

  filtroTexto = '';
  filtroTipo = 'Todos';
  filtroEstado = 'Todos';

  columnaOrden = 'numero';
  ordenAscendente = false;

  paginaActual = signal(1);
  elementosPorPagina = 10;

  modalAbierto = false;
  vistaPreviaAbierta = false;
  confirmarAbierto = false;
  editando = false;
  facSeleccionadaId = '';
  facAEliminar: Factura | null = null;

  get mensajeConfirmarEliminar(): string {
    return '¿Estás segura de anular el comprobante ' + (this.facAEliminar?.numero || '') + '?';
  }
  facVistaPrevia: Factura | null = null;

  formTipo: Factura['tipo'] = 'Borrador comercial';
  formClienteId = '';
  formClienteNombre = '';
  formClienteDocumento = '';
  formConceptoResumen = '';
  formSubtotal = 100.0;
  formFechaEmision = new Date().toISOString().slice(0, 10);
  formFechaVencimiento = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  formEstado: Factura['estado'] = 'Pendiente';

  readonly totalFacturado = computed(() => {
    return this.dataService.facturas()
      .filter((f) => f.estado !== 'Anulado')
      .reduce((acc, f) => acc + f.total, 0);
  });

  readonly totalCobrado = computed(() => {
    return this.dataService.facturas()
      .filter((f) => f.estado === 'Pagado')
      .reduce((acc, f) => acc + f.total, 0);
  });

  readonly totalPorCobrar = computed(() => {
    return this.dataService.facturas()
      .filter((f) => f.estado === 'Pendiente')
      .reduce((acc, f) => acc + f.total, 0);
  });

  readonly totalIgv = computed(() => {
    return this.dataService.facturas()
      .filter((f) => f.estado !== 'Anulado')
      .reduce((acc, f) => acc + f.igv, 0);
  });

  contarEstado(estado: string): number {
    return this.dataService.facturas().filter((f) => f.estado === estado).length;
  }

  readonly igvCalculadoModal = computed(() => {
    return (Number(this.formSubtotal || 0) * 0.18).toFixed(2);
  });

  readonly totalCalculadoModal = computed(() => {
    const s = Number(this.formSubtotal || 0);
    return (s + s * 0.18).toFixed(2);
  });

  readonly facturasFiltradas = computed(() => {
    let lista = this.dataService.facturas();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (f) =>
          f.numero.toLowerCase().includes(query) ||
          f.clienteNombre.toLowerCase().includes(query) ||
          f.clienteDocumento.toLowerCase().includes(query) ||
          f.conceptoResumen.toLowerCase().includes(query)
      );
    }

    if (this.filtroTipo !== 'Todos') {
      lista = lista.filter((f) => f.tipo === this.filtroTipo);
    }

    if (this.filtroEstado !== 'Todos') {
      lista = lista.filter((f) => f.estado === this.filtroEstado);
    }

    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Factura] ?? '';
      let valB: any = b[this.columnaOrden as keyof Factura] ?? '';
      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? valA - valB : valB - valA;
    });
  });

  readonly totalPaginas = computed(() => Math.ceil(this.facturasFiltradas().length / this.elementosPorPagina));
  readonly facturasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.facturasFiltradas().slice(inicio, inicio + this.elementosPorPagina);
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
      this.formClienteDocumento = 'DNI 42' + Math.floor(100000 + Math.random() * 900000);
    }
  }

  alternarEstadoPago(fac: Factura): void {
    const nuevo = fac.estado === 'Pendiente' ? 'Pagado' : fac.estado === 'Pagado' ? 'Pendiente' : 'Pendiente';
    this.dataService.actualizarFactura(fac.id, { estado: nuevo });
  }

  verVistaPrevia(fac: Factura): void {
    this.facVistaPrevia = fac;
    this.vistaPreviaAbierta = true;
  }

  abrirModalCrear(): void {
    this.editando = false;
    this.facSeleccionadaId = '';
    const clientes = this.dataService.clientes();

    this.formTipo = 'Borrador comercial';
    this.formClienteId = clientes[0]?.id || '';
    this.formClienteNombre = clientes[0]?.nombre || '';
    this.formClienteDocumento = 'DNI 42891024';
    this.formConceptoResumen = 'Lote de jabones botánicos y artesanales';
    this.formSubtotal = 80.0;
    this.formFechaEmision = new Date().toISOString().slice(0, 10);
    this.formFechaVencimiento = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    this.formEstado = 'Pendiente';
    this.modalAbierto = true;
  }

  abrirModalEditar(fac: Factura): void {
    this.editando = true;
    this.facSeleccionadaId = fac.id;
    this.formTipo = fac.tipo;
    this.formClienteId = fac.clienteId;
    this.formClienteNombre = fac.clienteNombre;
    this.formClienteDocumento = fac.clienteDocumento;
    this.formConceptoResumen = fac.conceptoResumen;
    this.formSubtotal = fac.subtotal;
    this.formFechaEmision = fac.fechaEmision;
    this.formFechaVencimiento = fac.fechaVencimiento;
    this.formEstado = fac.estado;
    this.modalAbierto = true;
  }

  guardarFactura(): void {
    if (!this.formClienteNombre || !this.formConceptoResumen) return;

    if (this.editando) {
      this.dataService.actualizarFactura(this.facSeleccionadaId, {
        tipo: this.formTipo,
        clienteId: this.formClienteId,
        clienteNombre: this.formClienteNombre,
        clienteDocumento: this.formClienteDocumento.trim(),
        conceptoResumen: this.formConceptoResumen.trim(),
        subtotal: Number(this.formSubtotal),
        fechaEmision: this.formFechaEmision,
        fechaVencimiento: this.formFechaVencimiento,
        estado: this.formEstado,
      });
    } else {
      this.dataService.crearFactura({
        tipo: this.formTipo,
        clienteId: this.formClienteId,
        clienteNombre: this.formClienteNombre,
        clienteDocumento: this.formClienteDocumento.trim(),
        conceptoResumen: this.formConceptoResumen.trim(),
        subtotal: Number(this.formSubtotal),
        fechaEmision: this.formFechaEmision,
        fechaVencimiento: this.formFechaVencimiento,
        estado: this.formEstado,
      });
    }
    this.modalAbierto = false;
  }

  confirmarEliminar(fac: Factura): void {
    this.facAEliminar = fac;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.facAEliminar) {
      this.dataService.eliminarFactura(this.facAEliminar.id);
      this.facAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Número', 'Tipo', 'Cliente', 'Documento', 'Emisión', 'Vencimiento', 'Subtotal S/', 'IGV S/', 'Total S/', 'Estado'];
    const filas = this.dataService.facturas().map((f) => [
      f.numero,
      f.tipo,
      f.clienteNombre,
      f.clienteDocumento,
      f.fechaEmision,
      f.fechaVencimiento,
      f.subtotal.toFixed(2),
      f.igv.toFixed(2),
      f.total.toFixed(2),
      f.estado,
    ]);
    this.dataService.exportarCsv('facturacion_soapyfun', columnas, filas);
  }
}
