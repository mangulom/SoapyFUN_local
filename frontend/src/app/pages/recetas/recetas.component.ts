import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Receta } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'soapy-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">FÓRMULAS Y RENDIMIENTO</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Recetas y Lotes</h1>
          <p class="text-xs text-slate-500 mt-1">Registra versiones de fórmulas, tamaños de lote, sobreengrasado y costos exactos por barra.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Nueva Receta
          </button>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recetas Registradas</span>
          <b class="text-2xl font-black text-slate-800">{{ dataService.recetas().length }}</b>
          <span class="text-[10px] text-slate-500">Versiones históricas activas</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proceso en Frío</span>
          <b class="text-2xl font-black text-blue-600">{{ contarMetodo('Proceso en frío') }}</b>
          <span class="text-[10px] text-slate-500">Jabones saponificados clásicos</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Melt & Pour</span>
          <b class="text-2xl font-black text-amber-600">{{ contarMetodo('Melt & Pour') }}</b>
          <span class="text-[10px] text-slate-500">Bases botánicas de glicerina</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo Medio / Barra</span>
          <b class="text-2xl font-black text-emerald-600">S/ {{ costoMedioBarra() }}</b>
          <span class="text-[10px] text-slate-500">Promedio de insumos directos</span>
        </div>
      </div>

      <!-- Filtros -->
      <div class="p-4 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div class="relative flex-1 max-w-md">
            <span class="absolute left-3 top-2.5 text-slate-400 text-sm">⌕</span>
            <input
              type="text"
              [(ngModel)]="filtroTexto"
              placeholder="Buscar por nombre, código o método..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select [(ngModel)]="filtroMetodo" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los métodos</option>
            <option value="Proceso en frío">Proceso en frío</option>
            <option value="Proceso en caliente">Proceso en caliente</option>
            <option value="Melt & Pour">Melt & Pour</option>
            <option value="Jabón líquido KOH">Jabón líquido KOH</option>
          </select>
          <select [(ngModel)]="filtroEstado" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los estados</option>
            <option value="Activa">Activa</option>
            <option value="En prueba">En prueba</option>
            <option value="Archivada">Archivada</option>
          </select>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ recetasFiltradas().length }}</b> fórmulas
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
                  RECETA {{ iconoOrden('nombre') }}
                </th>
                <th class="py-3.5 px-4">MÉTODO</th>
                <th class="py-3.5 px-4 text-center">TAMAÑO LOTE</th>
                <th class="py-3.5 px-4 text-right cursor-pointer hover:text-purple-700" (click)="cambiarOrden('costoPorBarra')">
                  COSTO / BARRA {{ iconoOrden('costoPorBarra') }}
                </th>
                <th class="py-3.5 px-4 text-center">VERSIÓN</th>
                <th class="py-3.5 px-4 text-center">ESTADO</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (receta of recetasPaginadas(); track receta.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-purple-800">{{ receta.codigo }}</td>
                  <td class="py-3 px-4">
                    <div class="font-bold text-slate-850">{{ receta.nombre }}</div>
                    <div class="text-[10px] text-slate-400">Sobreengrasado: {{ receta.sobreengrasado }}% · Sosa: {{ receta.concentracionSosa }}%</div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {{ receta.metodo }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <b class="text-slate-800">{{ receta.loteGramos }} g</b>
                    <span class="block text-[10px] text-slate-400">({{ receta.barrasEstimadas }} barras)</span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="font-bold text-emerald-600">S/ {{ receta.costoPorBarra.toFixed(2) }}</div>
                    <div class="text-[10px] text-slate-400">Total lote: S/ {{ receta.costoTotalLote.toFixed(2) }}</div>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold text-[10px]">
                      {{ receta.version }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="pill" [ngClass]="{
                      'pill-green': receta.estado === 'Activa',
                      'pill-amber': receta.estado === 'En prueba',
                      'pill-slate': receta.estado === 'Archivada'
                    }">
                      {{ receta.estado }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="dataService.duplicarReceta(receta.id)" class="action-btn text-blue-600 hover:bg-blue-50" title="Duplicar para nueva versión">
                        ⧉
                      </button>
                      <button (click)="abrirModalEditar(receta)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar receta">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(receta)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar receta">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">📜</div>
                    <div class="font-medium text-sm text-slate-600">No hay recetas registradas con estos filtros</div>
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
        [title]="editando ? 'Editar Receta' : 'Nueva Receta de Jabón'"
        [subtitle]="'Fórmula botánica con cálculo de lote y costos unitarios'"
        [eyebrow]="'FORMULACIÓN'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarReceta()" class="space-y-4">
          <div>
            <label class="form-label">Nombre de la Receta *</label>
            <input type="text" [(ngModel)]="formNombre" name="nombre" required placeholder="Ej: Jabón de Arcilla Verde y Carbón" class="form-input" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Método de Fabricación *</label>
              <select [(ngModel)]="formMetodo" name="metodo" class="form-input bg-white">
                <option value="Proceso en frío">Proceso en frío (Cold Process)</option>
                <option value="Proceso en caliente">Proceso en caliente (Hot Process)</option>
                <option value="Melt & Pour">Melt & Pour (Base de glicerina)</option>
                <option value="Jabón líquido KOH">Jabón líquido KOH</option>
              </select>
            </div>
            <div>
              <label class="form-label">Versión / Identificador *</label>
              <input type="text" [(ngModel)]="formVersion" name="version" required placeholder="Ej: v1, v2" class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Peso de Lote (g) *</label>
              <input type="number" min="100" step="50" [(ngModel)]="formLoteGramos" name="loteGramos" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Barras Estimadas *</label>
              <input type="number" min="1" [(ngModel)]="formBarrasEstimadas" name="barrasEstimadas" required class="form-input" />
            </div>
            <div>
              <label class="form-label">Costo por Barra (S/) *</label>
              <input type="number" min="0.1" step="0.1" [(ngModel)]="formCostoPorBarra" name="costoPorBarra" required class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Sobreengrasado (%)</label>
              <input type="number" min="0" max="25" [(ngModel)]="formSobreengrasado" name="sobreengrasado" class="form-input" />
            </div>
            <div>
              <label class="form-label">Concentración Sosa (%)</label>
              <input type="number" min="0" max="50" [(ngModel)]="formConcentracionSosa" name="concentracionSosa" class="form-input" />
            </div>
            <div>
              <label class="form-label">Estado de la Receta</label>
              <select [(ngModel)]="formEstado" name="estado" class="form-input bg-white">
                <option value="Activa">Activa</option>
                <option value="En prueba">En prueba</option>
                <option value="Archivada">Archivada</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label">Notas de Seguridad y Preparación</label>
            <textarea
              [(ngModel)]="formNotasSeguridad"
              name="notasSeguridad"
              rows="3"
              placeholder="Indica precauciones de seguridad, temperatura de lejía y fase de adición de aromas..."
              class="form-input"
            ></textarea>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar Cambios' : 'Registrar Receta' }}</button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal de Confirmación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Eliminar receta?"
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
    .pill-slate { background: #f1f5f9; color: #64748b; }
    .action-btn { width: 28px; height: 28px; border-radius: 8px; border: 0; display: inline-grid; place-items: center; cursor: pointer; }
    .page-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: inline-grid; place-items: center; font-weight: bold; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .form-label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .form-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #7c3aed; }
  `]
})
export class RecetasComponent {
  readonly dataService = inject(CrudDataService);

  filtroTexto = '';
  filtroMetodo = 'Todos';
  filtroEstado = 'Todos';

  columnaOrden = 'codigo';
  ordenAscendente = true;

  paginaActual = signal(1);
  elementosPorPagina = 10;

  modalAbierto = false;
  confirmarAbierto = false;
  editando = false;
  recetaSeleccionadaId = '';
  recetaAEliminar: Receta | null = null;

  formNombre = '';
  formMetodo: Receta['metodo'] = 'Proceso en frío';
  formLoteGramos = 1000;
  formBarrasEstimadas = 10;
  formCostoPorBarra = 12.0;
  formSobreengrasado = 8;
  formConcentracionSosa = 30;
  formVersion = 'v1';
  formEstado: Receta['estado'] = 'Activa';
  formNotasSeguridad = '';

  readonly costoMedioBarra = computed(() => {
    const list = this.dataService.recetas();
    if (!list.length) return '0.00';
    const sum = list.reduce((acc, r) => acc + r.costoPorBarra, 0);
    return (sum / list.length).toFixed(2);
  });

  contarMetodo(metodo: string): number {
    return this.dataService.recetas().filter((r) => r.metodo === metodo).length;
  }

  readonly recetasFiltradas = computed(() => {
    let lista = this.dataService.recetas();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (r) =>
          r.nombre.toLowerCase().includes(query) ||
          r.codigo.toLowerCase().includes(query) ||
          r.metodo.toLowerCase().includes(query)
      );
    }

    if (this.filtroMetodo !== 'Todos') {
      lista = lista.filter((r) => r.metodo === this.filtroMetodo);
    }

    if (this.filtroEstado !== 'Todos') {
      lista = lista.filter((r) => r.estado === this.filtroEstado);
    }

    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Receta] ?? '';
      let valB: any = b[this.columnaOrden as keyof Receta] ?? '';
      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? valA - valB : valB - valA;
    });
  });

  readonly totalPaginas = computed(() => Math.ceil(this.recetasFiltradas().length / this.elementosPorPagina));
  readonly recetasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.recetasFiltradas().slice(inicio, inicio + this.elementosPorPagina);
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
    this.recetaSeleccionadaId = '';
    this.formNombre = '';
    this.formMetodo = 'Proceso en frío';
    this.formLoteGramos = 1200;
    this.formBarrasEstimadas = 12;
    this.formCostoPorBarra = 11.5;
    this.formSobreengrasado = 8;
    this.formConcentracionSosa = 32;
    this.formVersion = 'v1';
    this.formEstado = 'Activa';
    this.formNotasSeguridad = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(rec: Receta): void {
    this.editando = true;
    this.recetaSeleccionadaId = rec.id;
    this.formNombre = rec.nombre;
    this.formMetodo = rec.metodo;
    this.formLoteGramos = rec.loteGramos;
    this.formBarrasEstimadas = rec.barrasEstimadas;
    this.formCostoPorBarra = rec.costoPorBarra;
    this.formSobreengrasado = rec.sobreengrasado;
    this.formConcentracionSosa = rec.concentracionSosa;
    this.formVersion = rec.version;
    this.formEstado = rec.estado;
    this.formNotasSeguridad = rec.notasSeguridad || '';
    this.modalAbierto = true;
  }

  guardarReceta(): void {
    if (!this.formNombre.trim()) return;

    if (this.editando) {
      this.dataService.actualizarReceta(this.recetaSeleccionadaId, {
        nombre: this.formNombre.trim(),
        metodo: this.formMetodo,
        loteGramos: Number(this.formLoteGramos),
        barrasEstimadas: Number(this.formBarrasEstimadas),
        costoPorBarra: Number(this.formCostoPorBarra),
        sobreengrasado: Number(this.formSobreengrasado),
        concentracionSosa: Number(this.formConcentracionSosa),
        version: this.formVersion.trim(),
        estado: this.formEstado,
        notasSeguridad: this.formNotasSeguridad.trim(),
      });
    } else {
      this.dataService.crearReceta({
        nombre: this.formNombre.trim(),
        metodo: this.formMetodo,
        loteGramos: Number(this.formLoteGramos),
        barrasEstimadas: Number(this.formBarrasEstimadas),
        costoPorBarra: Number(this.formCostoPorBarra),
        sobreengrasado: Number(this.formSobreengrasado),
        concentracionSosa: Number(this.formConcentracionSosa),
        version: this.formVersion.trim(),
        estado: this.formEstado,
        ingredientesCount: 5,
        notasSeguridad: this.formNotasSeguridad.trim(),
      });
    }
    this.modalAbierto = false;
  }

  get mensajeConfirmarEliminar(): string {
    return `¿Estás segura de eliminar la fórmula "${this.recetaAEliminar?.nombre || ''}"?`;
  }

  confirmarEliminar(rec: Receta): void {
    this.recetaAEliminar = rec;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.recetaAEliminar) {
      this.dataService.eliminarReceta(this.recetaAEliminar.id);
      this.recetaAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Código', 'Receta', 'Método', 'Lote (g)', 'Barras', 'Costo/Barra (S/)', 'Costo Lote (S/)', 'Versión', 'Estado'];
    const filas = this.dataService.recetas().map((r) => [
      r.codigo,
      r.nombre,
      r.metodo,
      r.loteGramos,
      r.barrasEstimadas,
      r.costoPorBarra.toFixed(2),
      r.costoTotalLote.toFixed(2),
      r.version,
      r.estado,
    ]);
    this.dataService.exportarCsv('recetas_soapyfun', columnas, filas);
  }
}
