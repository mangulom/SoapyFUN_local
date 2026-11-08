import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Producto } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'soapy-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="page-head flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">CATÁLOGO Y VITRINA</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Gestión de Productos</h1>
          <p class="text-xs text-slate-500 mt-1">Controla precios, costos, márgenes comerciales y existencias de tus jabones artesanales.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Nuevo Producto
          </button>
        </div>
      </div>

      <!-- Tarjetas de métricas rápidas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Productos</span>
          <b class="text-2xl font-black text-slate-800">{{ dataService.productos().length }}</b>
          <span class="text-[10px] text-slate-500">{{ dataService.productosActivos().length }} en venta activa</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margen Promedio</span>
          <b class="text-2xl font-black text-emerald-600">{{ margenPromedio() }}%</b>
          <span class="text-[10px] text-slate-500">Sobre precio de catálogo</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poco Stock</span>
          <b class="text-2xl font-black text-amber-600">{{ dataService.productosBajoStock().length }}</b>
          <span class="text-[10px] text-slate-500">Por debajo del mínimo</span>
        </div>
        <div class="stat-card border-l-4 border-l-rose-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agotados</span>
          <b class="text-2xl font-black text-rose-600">{{ agotadosCount() }}</b>
          <span class="text-[10px] text-slate-500">Requieren tanda de producción</span>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="card p-4 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div class="relative flex-1 max-w-md">
            <span class="absolute left-3 top-2.5 text-slate-400 text-sm">⌕</span>
            <input
              type="text"
              [(ngModel)]="filtroTexto"
              placeholder="Buscar por nombre, código o aroma..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
          </div>
          <select
            [(ngModel)]="filtroEstado"
            class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Publicado">Publicados</option>
            <option value="Borrador">Borradores</option>
            <option value="Agotado">Agotados</option>
            <option value="BajoStock">Bajo stock</option>
          </select>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ productosFiltrados().length }}</b> de {{ dataService.productos().length }}
        </div>
      </div>

      <!-- Tabla CRUD -->
      <div class="card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('codigo')">
                  CÓDIGO {{ iconoOrden('codigo') }}
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('nombre')">
                  PRODUCTO {{ iconoOrden('nombre') }}
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700 text-right" (click)="cambiarOrden('precio')">
                  PRECIO (S/) {{ iconoOrden('precio') }}
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700 text-right" (click)="cambiarOrden('costo')">
                  COSTO (S/) {{ iconoOrden('costo') }}
                </th>
                <th class="py-3.5 px-4 text-right cursor-pointer hover:text-purple-700" (click)="cambiarOrden('margen')">
                  MARGEN {{ iconoOrden('margen') }}
                </th>
                <th class="py-3.5 px-4 text-center cursor-pointer hover:text-purple-700" (click)="cambiarOrden('stock')">
                  DISPONIBLE {{ iconoOrden('stock') }}
                </th>
                <th class="py-3.5 px-4 text-center">ESTADO</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (producto of productosPaginados(); track producto.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-purple-800">{{ producto.codigo }}</td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="soap-icon" [ngClass]="'soap-' + (producto.tono || 'lavender')">
                        {{ producto.icono || '🧼' }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-850">{{ producto.nombre }}</div>
                        <div class="text-[10px] text-slate-400">{{ producto.categoria }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-right font-bold text-slate-800">S/ {{ producto.precio.toFixed(2) }}</td>
                  <td class="py-3 px-4 text-right text-slate-500">S/ {{ producto.costo.toFixed(2) }}</td>
                  <td class="py-3 px-4 text-right">
                    <span class="font-bold text-emerald-600">{{ calcularMargen(producto) }}%</span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <span class="font-bold" [class.text-amber-600]="producto.stock <= producto.stockMinimo && producto.stock > 0" [class.text-rose-600]="producto.stock === 0">
                        {{ producto.stock }}
                      </span>
                      <small class="text-slate-400 text-[10px]">u.</small>
                    </div>
                    @if (producto.stock <= producto.stockMinimo && producto.stock > 0) {
                      <div class="text-[9px] text-amber-600 font-medium">Bajo mínimo ({{ producto.stockMinimo }})</div>
                    }
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="pill" [ngClass]="{
                      'pill-green': producto.estado === 'Publicado',
                      'pill-amber': producto.estado === 'Borrador',
                      'pill-red': producto.estado === 'Agotado'
                    }">
                      {{ producto.estado }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="abrirModalEditar(producto)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar producto">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(producto)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar producto">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">🫧</div>
                    <div class="font-medium text-sm text-slate-600">No se encontraron productos</div>
                    <div class="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o añade un nuevo jabón al catálogo.</div>
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
            <span>por página</span>
          </div>

          <div class="flex items-center gap-1">
            <button
              (click)="paginaActual.set(paginaActual() - 1)"
              [disabled]="paginaActual() === 1"
              class="page-btn"
            >
              ‹
            </button>
            <span class="px-2">Página <b>{{ paginaActual() }}</b> de {{ totalPaginas() || 1 }}</span>
            <button
              (click)="paginaActual.set(paginaActual() + 1)"
              [disabled]="paginaActual() >= totalPaginas()"
              class="page-btn"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de Crear / Editar -->
      <soapy-crud-modal
        [isOpen]="modalAbierto"
        [title]="editando ? 'Editar Producto' : 'Nuevo Producto'"
        [subtitle]="editando ? 'Modifica los valores del catálogo' : 'Agrega un jabón botánico a la vitrina de SoapyFUN'"
        [eyebrow]="'CATÁLOGO'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarProducto()" class="space-y-4">
          <div>
            <label class="form-label">Nombre del Producto *</label>
            <input
              type="text"
              [(ngModel)]="formNombre"
              name="nombre"
              required
              placeholder="Ej: Jabón de Romero & Eucalipto"
              class="form-input"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Categoría / Tipo *</label>
              <input
                type="text"
                [(ngModel)]="formCategoria"
                name="categoria"
                required
                placeholder="Ej: Jabón corporal · Barra 100 g"
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Presentación *</label>
              <input
                type="text"
                [(ngModel)]="formPresentacion"
                name="presentacion"
                required
                placeholder="Ej: Barra 100 g"
                class="form-input"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Precio de Venta (S/) *</label>
              <input
                type="number"
                step="0.10"
                min="0.10"
                [(ngModel)]="formPrecio"
                name="precio"
                required
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Costo Unitario (S/) *</label>
              <input
                type="number"
                step="0.10"
                min="0"
                [(ngModel)]="formCosto"
                name="costo"
                required
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Margen Calculado</label>
              <div class="py-2.5 px-3 rounded-xl bg-purple-50 text-purple-900 font-bold text-xs border border-purple-100 flex items-center justify-between">
                <span>Margen</span>
                <span class="text-emerald-600">{{ margenModal() }}%</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Stock Actual *</label>
              <input
                type="number"
                min="0"
                [(ngModel)]="formStock"
                name="stock"
                required
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Stock Mínimo *</label>
              <input
                type="number"
                min="0"
                [(ngModel)]="formStockMinimo"
                name="stockMinimo"
                required
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Estado *</label>
              <select [(ngModel)]="formEstado" name="estado" class="form-input bg-white">
                <option value="Publicado">Publicado</option>
                <option value="Borrador">Borrador</option>
                <option value="Agotado">Agotado</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Aroma / Notas Olfativas</label>
              <input
                type="text"
                [(ngModel)]="formAroma"
                name="aroma"
                placeholder="Ej: Lavanda y flores silvestres"
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Tono Visual / Estilo</label>
              <select [(ngModel)]="formTono" name="tono" class="form-input bg-white">
                <option value="lavender">Lavanda (Púrpura suave)</option>
                <option value="honey">Miel (Dorado cálido)</option>
                <option value="citrus">Cítrico (Verde fresco)</option>
                <option value="rose">Rosa (Rosa empolvado)</option>
                <option value="mint">Menta (Turquesa botánico)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label">Beneficios e Indicaciones</label>
            <textarea
              [(ngModel)]="formBeneficios"
              name="beneficios"
              rows="2"
              placeholder="Ej: Piel grasa, exfoliante suave y calmante..."
              class="form-input"
            ></textarea>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              {{ editando ? 'Guardar Cambios' : 'Crear Producto' }}
            </button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal de Confirmación de Eliminación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Eliminar producto del catálogo?"
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
      background: white;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .btn-primary {
      background: #facc15;
      color: #3b0764;
      font-weight: 700;
      font-size: 12px;
      padding: 9px 16px;
      border-radius: 10px;
      border: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .btn-primary:hover { background: #eab308; }
    .btn-secondary {
      background: white;
      color: #475569;
      font-weight: 600;
      font-size: 12px;
      padding: 9px 14px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-secondary:hover { background: #f8fafc; color: #1e293b; }
    .soap-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      font-size: 16px;
      flex: none;
    }
    .soap-lavender { background: #f3e8ff; color: #7e22ce; }
    .soap-honey { background: #fef3c7; color: #b45309; }
    .soap-citrus { background: #dcfce7; color: #15803d; }
    .soap-rose { background: #ffe4e6; color: #be123c; }
    .soap-mint { background: #ccfbf1; color: #0f766e; }
    .pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
    }
    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-amber { background: #fef3c7; color: #b45309; }
    .pill-red { background: #fee2e2; color: #b91c1c; }
    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 0;
      display: inline-grid;
      place-items: center;
      cursor: pointer;
      font-size: 13px;
    }
    .page-btn {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: white;
      cursor: pointer;
      display: inline-grid;
      place-items: center;
      font-weight: bold;
    }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .form-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 4px;
    }
    .form-input {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 8px 12px;
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
    }
    .form-input:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
    }
  `]
})
export class ProductosComponent {
  readonly dataService = inject(CrudDataService);

  // Filtros y Búsqueda
  filtroTexto = '';
  filtroEstado = 'Todos';

  // Ordenamiento
  columnaOrden = 'codigo';
  ordenAscendente = true;

  // Paginación
  paginaActual = signal(1);
  elementosPorPagina = 10;

  // Modales
  modalAbierto = false;
  confirmarAbierto = false;
  editando = false;
  productoSeleccionadoId = '';
  productoAEliminar: Producto | null = null;

  // Formulario
  formNombre = '';
  formCategoria = 'Jabón corporal · Barra 100 g';
  formPresentacion = 'Barra 100 g';
  formPrecio = 28.0;
  formCosto = 12.0;
  formStock = 20;
  formStockMinimo = 8;
  formEstado: Producto['estado'] = 'Publicado';
  formAroma = '';
  formTono: Producto['tono'] = 'lavender';
  formBeneficios = '';

  readonly margenPromedio = computed(() => {
    const prods = this.dataService.productos();
    if (!prods.length) return 0;
    const total = prods.reduce((sum, p) => sum + ((p.precio - p.costo) / p.precio) * 100, 0);
    return Math.round(total / prods.length);
  });

  readonly agotadosCount = computed(() => {
    return this.dataService.productos().filter((p) => p.stock === 0 || p.estado === 'Agotado').length;
  });

  readonly margenModal = computed(() => {
    if (!this.formPrecio || this.formPrecio <= 0) return 0;
    const m = ((this.formPrecio - (this.formCosto || 0)) / this.formPrecio) * 100;
    return Math.round(m);
  });

  readonly productosFiltrados = computed(() => {
    let lista = this.dataService.productos();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(query) ||
          p.codigo.toLowerCase().includes(query) ||
          p.categoria.toLowerCase().includes(query) ||
          (p.aroma && p.aroma.toLowerCase().includes(query))
      );
    }

    if (this.filtroEstado !== 'Todos') {
      if (this.filtroEstado === 'BajoStock') {
        lista = lista.filter((p) => p.stock <= p.stockMinimo);
      } else {
        lista = lista.filter((p) => p.estado === this.filtroEstado);
      }
    }

    // Ordenamiento
    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Producto] ?? '';
      let valB: any = b[this.columnaOrden as keyof Producto] ?? '';

      if (this.columnaOrden === 'margen') {
        valA = ((a.precio - a.costo) / a.precio) * 100;
        valB = ((b.precio - b.costo) / b.precio) * 100;
      }

      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? valA - valB : valB - valA;
    });
  });

  readonly totalPaginas = computed(() => {
    return Math.ceil(this.productosFiltrados().length / this.elementosPorPagina);
  });

  readonly productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.productosFiltrados().slice(inicio, inicio + this.elementosPorPagina);
  });

  cambiarOrden(columna: string): void {
    if (this.columnaOrden === columna) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.columnaOrden = columna;
      this.ordenAscendente = true;
    }
  }

  iconoOrden(columna: string): string {
    if (this.columnaOrden !== columna) return '↕';
    return this.ordenAscendente ? '↑' : '↓';
  }

  calcularMargen(prod: Producto): number {
    if (!prod.precio || prod.precio <= 0) return 0;
    return Math.round(((prod.precio - prod.costo) / prod.precio) * 100);
  }

  abrirModalCrear(): void {
    this.editando = false;
    this.productoSeleccionadoId = '';
    this.formNombre = '';
    this.formCategoria = 'Jabón corporal · Barra 100 g';
    this.formPresentacion = 'Barra 100 g';
    this.formPrecio = 28.0;
    this.formCosto = 11.5;
    this.formStock = 24;
    this.formStockMinimo = 8;
    this.formEstado = 'Publicado';
    this.formAroma = '';
    this.formTono = 'lavender';
    this.formBeneficios = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(prod: Producto): void {
    this.editando = true;
    this.productoSeleccionadoId = prod.id;
    this.formNombre = prod.nombre;
    this.formCategoria = prod.categoria;
    this.formPresentacion = prod.presentacion;
    this.formPrecio = prod.precio;
    this.formCosto = prod.costo;
    this.formStock = prod.stock;
    this.formStockMinimo = prod.stockMinimo;
    this.formEstado = prod.estado;
    this.formAroma = prod.aroma || '';
    this.formTono = prod.tono || 'lavender';
    this.formBeneficios = prod.beneficios || '';
    this.modalAbierto = true;
  }

  guardarProducto(): void {
    if (!this.formNombre.trim()) return;

    if (this.editando) {
      this.dataService.actualizarProducto(this.productoSeleccionadoId, {
        nombre: this.formNombre.trim(),
        categoria: this.formCategoria.trim(),
        presentacion: this.formPresentacion.trim(),
        precio: Number(this.formPrecio),
        costo: Number(this.formCosto),
        stock: Number(this.formStock),
        stockMinimo: Number(this.formStockMinimo),
        estado: this.formEstado,
        aroma: this.formAroma.trim(),
        tono: this.formTono,
        beneficios: this.formBeneficios.trim(),
      });
    } else {
      this.dataService.crearProducto({
        nombre: this.formNombre.trim(),
        categoria: this.formCategoria.trim(),
        presentacion: this.formPresentacion.trim(),
        precio: Number(this.formPrecio),
        costo: Number(this.formCosto),
        stock: Number(this.formStock),
        stockMinimo: Number(this.formStockMinimo),
        estado: this.formEstado,
        aroma: this.formAroma.trim(),
        tono: this.formTono,
        icono: this.formTono === 'honey' ? '☼' : this.formTono === 'citrus' ? '✺' : this.formTono === 'rose' ? '❦' : this.formTono === 'mint' ? '🍃' : '✿',
        beneficios: this.formBeneficios.trim(),
      });
    }

    this.modalAbierto = false;
  }

  get mensajeConfirmarEliminar(): string {
    return `¿Estás segura de retirar "${this.productoAEliminar?.nombre || ''}"? Esta acción eliminará su registro de ventas y vitrina.`;
  }

  confirmarEliminar(prod: Producto): void {
    this.productoAEliminar = prod;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.productoAEliminar) {
      this.dataService.eliminarProducto(this.productoAEliminar.id);
      this.productoAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Código', 'Nombre', 'Categoría', 'Precio S/', 'Costo S/', 'Margen %', 'Stock', 'Mínimo', 'Estado'];
    const filas = this.dataService.productos().map((p) => [
      p.codigo,
      p.nombre,
      p.categoria,
      p.precio.toFixed(2),
      p.costo.toFixed(2),
      this.calcularMargen(p),
      p.stock,
      p.stockMinimo,
      p.estado,
    ]);
    this.dataService.exportarCsv('productos_soapyfun', columnas, filas);
  }
}
