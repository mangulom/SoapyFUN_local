import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Insumo } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'soapy-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">MATERIAS PRIMAS Y ALMACÉN</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Control de Insumos</h1>
          <p class="text-xs text-slate-500 mt-1">Monitorea existencias de aceites, sosa cáustica, esencias, micas y empaques con alertas de reposición.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Nuevo Insumo
          </button>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valorización Almacén</span>
          <b class="text-2xl font-black text-purple-900">S/ {{ dataService.valorInventarioInsumos().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">Costo promedio vigente</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Insumos Activos</span>
          <b class="text-2xl font-black text-emerald-600">{{ dataService.insumos().length }}</b>
          <span class="text-[10px] text-slate-500">Materias primas registradas</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por Reponer</span>
          <b class="text-2xl font-black text-amber-600">{{ dataService.insumosBajoStock().length }}</b>
          <span class="text-[10px] text-slate-500">Stock menor o igual al mínimo</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedores Clave</span>
          <b class="text-2xl font-black text-blue-600">{{ totalProveedoresInsumos() }}</b>
          <span class="text-[10px] text-slate-500">Red de abastecimiento</span>
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
              placeholder="Buscar insumo, proveedor o código..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select [(ngModel)]="filtroGrupo" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todas las categorías</option>
            <option value="Aceites y mantecas">Aceites y mantecas</option>
            <option value="Álcalis y bases">Álcalis y bases</option>
            <option value="Fragancias y aceites esenciales">Fragancias y aceites esenciales</option>
            <option value="Colorantes y micas">Colorantes y micas</option>
            <option value="Aditivos botánicos">Aditivos botánicos</option>
            <option value="Empaques y envases">Empaques y envases</option>
          </select>
          <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none px-2 py-1.5 rounded-lg hover:bg-slate-50">
            <input type="checkbox" [(ngModel)]="filtroSoloBajoStock" class="rounded text-purple-600" />
            <span>Solo con stock bajo</span>
          </label>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ insumosFiltrados().length }}</b> materias primas
        </div>
      </div>

      <!-- Tabla CRUD -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('codigo')">
                  CÓDIGO {{ iconoOrden('codigo') }}
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('nombre')">
                  INSUMO {{ iconoOrden('nombre') }}
                </th>
                <th class="py-3.5 px-4">GRUPO</th>
                <th class="py-3.5 px-4 text-center cursor-pointer hover:text-purple-700" (click)="cambiarOrden('stock')">
                  STOCK DISPONIBLE {{ iconoOrden('stock') }}
                </th>
                <th class="py-3.5 px-4 text-right cursor-pointer hover:text-purple-700" (click)="cambiarOrden('costoUnitario')">
                  COSTO / UNIDAD {{ iconoOrden('costoUnitario') }}
                </th>
                <th class="py-3.5 px-4 text-right">VALORIZACIÓN</th>
                <th class="py-3.5 px-4">PROVEEDOR</th>
                <th class="py-3.5 px-4 text-center">ESTADO</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (insumo of insumosPaginados(); track insumo.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-purple-800">{{ insumo.codigo }}</td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-850">{{ insumo.nombre }}</div>
                    @if (insumo.marca) {
                      <div class="text-[10px] text-slate-400">Marca: {{ insumo.marca }}</div>
                    }
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                      {{ insumo.grupo }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <div class="inline-flex items-center gap-1">
                      <b class="text-slate-800" [class.text-amber-600]="insumo.stock <= insumo.stockMinimo">
                        {{ insumo.stock }}
                      </b>
                      <span class="text-slate-400 text-[10px]">{{ insumo.unidad }}</span>
                    </div>
                    <div class="text-[9px] text-slate-400">Mín: {{ insumo.stockMinimo }} {{ insumo.unidad }}</div>
                  </td>
                  <td class="py-3 px-4 text-right font-semibold text-slate-800">
                    S/ {{ insumo.costoUnitario.toFixed(2) }} <span class="text-[10px] text-slate-400">/ {{ insumo.unidad }}</span>
                  </td>
                  <td class="py-3 px-4 text-right font-bold text-purple-900">
                    S/ {{ (insumo.stock * insumo.costoUnitario).toFixed(2) }}
                  </td>
                  <td class="py-3 px-4 text-slate-600">
                    <div class="truncate max-w-[150px]" [title]="insumo.proveedorPrincipal">
                      {{ insumo.proveedorPrincipal }}
                    </div>
                  </td>
                  <td class="py-3 px-4 text-center">
                    @if (insumo.stock <= insumo.stockMinimo) {
                      <span class="pill pill-amber">Reponer</span>
                    } @else {
                      <span class="pill pill-green">En stock</span>
                    }
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="abrirModalAjuste(insumo)" class="action-btn text-amber-600 hover:bg-amber-50" title="Ajuste rápido de stock">
                        ⚡
                      </button>
                      <button (click)="abrirModalEditar(insumo)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar insumo">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(insumo)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar insumo">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">🌿</div>
                    <div class="font-medium text-sm text-slate-600">No se encontraron insumos</div>
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
        [title]="editando ? 'Editar Insumo' : 'Nuevo Insumo de Taller'"
        [subtitle]="'Materia prima botánica o material de empaque'"
        [eyebrow]="'INVENTARIO'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarInsumo()" class="space-y-4">
          <div>
            <label class="form-label">Nombre del Insumo *</label>
            <input type="text" [(ngModel)]="formNombre" name="nombre" required placeholder="Ej: Aceite de Almendras Dulces" class="form-input" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Grupo / Categoría *</label>
              <select [(ngModel)]="formGrupo" name="grupo" class="form-input bg-white">
                <option value="Aceites y mantecas">Aceites y mantecas</option>
                <option value="Álcalis y bases">Álcalis y bases</option>
                <option value="Fragancias y aceites esenciales">Fragancias y aceites esenciales</option>
                <option value="Colorantes y micas">Colorantes y micas</option>
                <option value="Aditivos botánicos">Aditivos botánicos</option>
                <option value="Empaques y envases">Empaques y envases</option>
              </select>
            </div>
            <div>
              <label class="form-label">Unidad de Medida *</label>
              <select [(ngModel)]="formUnidad" name="unidad" class="form-input bg-white">
                <option value="kg">kg (Kilogramos)</option>
                <option value="g">g (Gramos)</option>
                <option value="L">L (Litros)</option>
                <option value="ml">ml (Mililitros)</option>
                <option value="unidades">unidades</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Stock Actual *</label>
              <input type="number" min="0" step="0.01" [(ngModel)]="formStock" name="stock" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Stock Mínimo *</label>
              <input type="number" min="0" step="0.01" [(ngModel)]="formStockMinimo" name="stockMinimo" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Costo Unitario (S/) *</label>
              <input type="number" min="0.01" step="0.01" [(ngModel)]="formCostoUnitario" name="costoUnitario" required class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Proveedor Principal *</label>
              <input type="text" [(ngModel)]="formProveedorPrincipal" name="proveedor" required placeholder="Ej: Botánica Andina SAC" class="form-input" />
            </div>
            <div>
              <label class="form-label">Marca o Especificación</label>
              <input type="text" [(ngModel)]="formMarca" name="marca" placeholder="Ej: Prensado en frío 100% puro" class="form-input" />
            </div>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar Cambios' : 'Registrar Insumo' }}</button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal de Ajuste Rápido de Stock -->
      <soapy-crud-modal
        [isOpen]="ajusteAbierto"
        title="Ajuste Rápido de Existencias"
        [subtitle]="'Insumo: ' + (insumoAjuste?.nombre || '')"
        [eyebrow]="'ALMACÉN'"
        (close)="ajusteAbierto = false"
      >
        <div class="space-y-4">
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div class="text-slate-500">Stock registrado actualmente:</div>
            <div class="text-lg font-bold text-slate-800">{{ insumoAjuste?.stock }} {{ insumoAjuste?.unidad }}</div>
          </div>

          <div>
            <label class="form-label">Nuevo Stock Verificado ({{ insumoAjuste?.unidad }}) *</label>
            <input type="number" step="0.01" min="0" [(ngModel)]="nuevoStockValor" class="form-input" />
          </div>

          <div>
            <label class="form-label">Motivo del Ajuste *</label>
            <select [(ngModel)]="motivoAjuste" class="form-input bg-white">
              <option value="Conteo físico de inventario">Conteo físico de inventario</option>
              <option value="Merma o descarte por caducidad">Merma o descarte por caducidad</option>
              <option value="Entrada rápida sin factura">Entrada rápida sin factura</option>
              <option value="Consumo en prueba experimental">Consumo en prueba experimental</option>
            </select>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="ajusteAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="button" (click)="guardarAjuste()" class="btn-primary">Confirmar Ajuste</button>
          </div>
        </div>
      </soapy-crud-modal>

      <!-- Modal de Confirmación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Eliminar insumo?"
        [message]="mensajeConfirmarEliminar"
        confirmText="Sí, eliminar"
        (confirm)="eliminarConfirmado()"
        (cancel)="confirmarAbierto = false">
      </soapy-confirm-dialog>
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
    .action-btn { width: 28px; height: 28px; border-radius: 8px; border: 0; display: inline-grid; place-items: center; cursor: pointer; }
    .page-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: inline-grid; place-items: center; font-weight: bold; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .form-label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .form-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #7c3aed; }
  `]
})
export class InsumosComponent {
  readonly dataService = inject(CrudDataService);

  filtroTexto = '';
  filtroGrupo = 'Todos';
  filtroSoloBajoStock = false;

  columnaOrden = 'codigo';
  ordenAscendente = true;

  paginaActual = signal(1);
  elementosPorPagina = 10;

  modalAbierto = false;
  ajusteAbierto = false;
  confirmarAbierto = false;
  editando = false;

  insumoSeleccionadoId = '';
  insumoAEliminar: Insumo | null = null;
  insumoAjuste: Insumo | null = null;
  nuevoStockValor = 0;
  motivoAjuste = 'Conteo físico de inventario';

  formNombre = '';
  formGrupo: Insumo['grupo'] = 'Aceites y mantecas';
  formStock = 2.0;
  formUnidad: Insumo['unidad'] = 'kg';
  formStockMinimo = 1.0;
  formCostoUnitario = 35.0;
  formProveedorPrincipal = '';
  formMarca = '';

  readonly totalProveedoresInsumos = computed(() => {
    const list = this.dataService.insumos().map((i) => i.proveedorPrincipal).filter(Boolean);
    return new Set(list).size;
  });

  readonly insumosFiltrados = computed(() => {
    let lista = this.dataService.insumos();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (i) =>
          i.nombre.toLowerCase().includes(query) ||
          i.codigo.toLowerCase().includes(query) ||
          i.proveedorPrincipal.toLowerCase().includes(query)
      );
    }

    if (this.filtroGrupo !== 'Todos') {
      lista = lista.filter((i) => i.grupo === this.filtroGrupo);
    }

    if (this.filtroSoloBajoStock) {
      lista = lista.filter((i) => i.stock <= i.stockMinimo);
    }

    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Insumo] ?? '';
      let valB: any = b[this.columnaOrden as keyof Insumo] ?? '';
      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? valA - valB : valB - valA;
    });
  });

  readonly totalPaginas = computed(() => Math.ceil(this.insumosFiltrados().length / this.elementosPorPagina));
  readonly insumosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.insumosFiltrados().slice(inicio, inicio + this.elementosPorPagina);
  });

  cambiarOrden(columna: string): void {
    if (this.columnaOrden === columna) this.ordenAscendente = !this.ordenAscendente;
    else { this.columnaOrden = columna; this.ordenAscendente = true; }
  }

  iconoOrden(columna: string): string {
    if (this.columnaOrden !== columna) return '↕';
    return this.ordenAscendente ? '↑' : '↓';
  }

  abrirModalCrear(): void {
    this.editando = false;
    this.insumoSeleccionadoId = '';
    this.formNombre = '';
    this.formGrupo = 'Aceites y mantecas';
    this.formStock = 2.0;
    this.formUnidad = 'kg';
    this.formStockMinimo = 1.0;
    this.formCostoUnitario = 35.0;
    this.formProveedorPrincipal = 'Botánica Andina SAC';
    this.formMarca = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(ins: Insumo): void {
    this.editando = true;
    this.insumoSeleccionadoId = ins.id;
    this.formNombre = ins.nombre;
    this.formGrupo = ins.grupo;
    this.formStock = ins.stock;
    this.formUnidad = ins.unidad;
    this.formStockMinimo = ins.stockMinimo;
    this.formCostoUnitario = ins.costoUnitario;
    this.formProveedorPrincipal = ins.proveedorPrincipal;
    this.formMarca = ins.marca || '';
    this.modalAbierto = true;
  }

  guardarInsumo(): void {
    if (!this.formNombre.trim()) return;

    if (this.editando) {
      this.dataService.actualizarInsumo(this.insumoSeleccionadoId, {
        nombre: this.formNombre.trim(),
        grupo: this.formGrupo,
        stock: Number(this.formStock),
        unidad: this.formUnidad,
        stockMinimo: Number(this.formStockMinimo),
        costoUnitario: Number(this.formCostoUnitario),
        proveedorPrincipal: this.formProveedorPrincipal.trim(),
        marca: this.formMarca.trim(),
      });
    } else {
      this.dataService.crearInsumo({
        nombre: this.formNombre.trim(),
        grupo: this.formGrupo,
        stock: Number(this.formStock),
        unidad: this.formUnidad,
        stockMinimo: Number(this.formStockMinimo),
        costoUnitario: Number(this.formCostoUnitario),
        proveedorPrincipal: this.formProveedorPrincipal.trim(),
        marca: this.formMarca.trim(),
      });
    }
    this.modalAbierto = false;
  }

  abrirModalAjuste(ins: Insumo): void {
    this.insumoAjuste = ins;
    this.nuevoStockValor = ins.stock;
    this.motivoAjuste = 'Conteo físico de inventario';
    this.ajusteAbierto = true;
  }

  guardarAjuste(): void {
    if (!this.insumoAjuste) return;
    this.dataService.ajustarStockInsumo(this.insumoAjuste.id, Number(this.nuevoStockValor), this.motivoAjuste);
    this.ajusteAbierto = false;
    this.insumoAjuste = null;
  }

  get mensajeConfirmarEliminar(): string {
    return `¿Estás segura de retirar "${this.insumoAEliminar?.nombre || ''}" del inventario?`;
  }

  confirmarEliminar(ins: Insumo): void {
    this.insumoAEliminar = ins;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.insumoAEliminar) {
      this.dataService.eliminarInsumo(this.insumoAEliminar.id);
      this.insumoAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Código', 'Insumo', 'Grupo', 'Stock', 'Unidad', 'Stock Mínimo', 'Costo Unitario S/', 'Valor Total S/', 'Proveedor'];
    const filas = this.dataService.insumos().map((i) => [
      i.codigo,
      i.nombre,
      i.grupo,
      i.stock,
      i.unidad,
      i.stockMinimo,
      i.costoUnitario.toFixed(2),
      (i.stock * i.costoUnitario).toFixed(2),
      i.proveedorPrincipal,
    ]);
    this.dataService.exportarCsv('insumos_soapyfun', columnas, filas);
  }
}
