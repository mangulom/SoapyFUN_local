import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Proveedor } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'soapy-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">CADENA DE SUMINISTRO</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Directorio de Proveedores</h1>
          <p class="text-xs text-slate-500 mt-1">Gestiona tus contactos, condiciones comerciales y valoración de proveedores de aceites, sosa y packaging.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Nuevo Proveedor
          </button>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedores Activos</span>
          <b class="text-2xl font-black text-slate-800">{{ proveedoresActivos() }}</b>
          <span class="text-[10px] text-slate-500">De {{ dataService.proveedores().length }} registrados</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valoración Media</span>
          <b class="text-2xl font-black text-amber-600">★ {{ calificacionPromedio() }}</b>
          <span class="text-[10px] text-slate-500">Calidad y puntualidad</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gasto Acumulado</span>
          <b class="text-2xl font-black text-emerald-600">S/ {{ totalGasto().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">Histórico de compras</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ciudades</span>
          <b class="text-2xl font-black text-blue-600">{{ ciudadesTotal() }}</b>
          <span class="text-[10px] text-slate-500">Lima, Arequipa y regiones</span>
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
              placeholder="Buscar por empresa, contacto, teléfono o ciudad..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select [(ngModel)]="filtroEstado" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ proveedoresFiltrados().length }}</b> proveedores
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
                  EMPRESA / PROVEEDOR {{ iconoOrden('nombre') }}
                </th>
                <th class="py-3.5 px-4">CATEGORÍA</th>
                <th class="py-3.5 px-4">CONTACTO & TELÉFONO</th>
                <th class="py-3.5 px-4 text-center">VALORACIÓN</th>
                <th class="py-3.5 px-4 text-center cursor-pointer hover:text-purple-700" (click)="cambiarOrden('totalCompras')">
                  COMPRAS {{ iconoOrden('totalCompras') }}
                </th>
                <th class="py-3.5 px-4 text-right cursor-pointer hover:text-purple-700" (click)="cambiarOrden('gastoTotal')">
                  TOTAL COMPRADO {{ iconoOrden('gastoTotal') }}
                </th>
                <th class="py-3.5 px-4 text-center">ESTADO</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (prov of proveedoresPaginados(); track prov.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-purple-800">{{ prov.codigo }}</td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="avatar-box" [ngClass]="'avatar-' + (prov.color || 'purple')">
                        {{ prov.iniciales || 'PR' }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-850">{{ prov.nombre }}</div>
                        <div class="text-[10px] text-slate-400">{{ prov.ciudad }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                      {{ prov.categoria }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="font-semibold text-slate-800">{{ prov.contacto }}</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>☎ {{ prov.telefono }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="text-amber-500 font-bold text-xs">
                      ★ {{ prov.valoracion }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center font-bold text-slate-800">
                    {{ prov.totalCompras }}
                  </td>
                  <td class="py-3 px-4 text-right font-bold text-purple-900">
                    S/ {{ prov.gastoTotal.toFixed(2) }}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="pill" [ngClass]="prov.estado === 'Activo' ? 'pill-green' : 'pill-slate'">
                      {{ prov.estado }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="abrirModalEditar(prov)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar proveedor">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(prov)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar proveedor">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">🏭</div>
                    <div class="font-medium text-sm text-slate-600">No hay proveedores registrados con estos filtros</div>
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
        [title]="editando ? 'Editar Proveedor' : 'Nuevo Proveedor'"
        [subtitle]="'Registra un nuevo contacto de materias primas o insumos de empaque'"
        [eyebrow]="'PROVEEDORES'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarProveedor()" class="space-y-4">
          <div>
            <label class="form-label">Nombre Comercial o Razón Social *</label>
            <input type="text" [(ngModel)]="formNombre" name="nombre" required placeholder="Ej: Botánica Andina SAC" class="form-input" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Categoría de Insumos *</label>
              <input type="text" [(ngModel)]="formCategoria" name="categoria" required placeholder="Ej: Aceites vegetales y ceras" class="form-input" />
            </div>
            <div>
              <label class="form-label">Persona de Contacto *</label>
              <input type="text" [(ngModel)]="formContacto" name="contacto" required placeholder="Ej: Carlos Méndez" class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Teléfono / WhatsApp *</label>
              <input type="text" [(ngModel)]="formTelefono" name="telefono" required placeholder="Ej: +51 984 123 456" class="form-input" />
            </div>
            <div>
              <label class="form-label">Correo Electrónico</label>
              <input type="email" [(ngModel)]="formEmail" name="email" placeholder="ventas@proveedor.pe" class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="form-label">Ciudad / Ubicación</label>
              <input type="text" [(ngModel)]="formCiudad" name="ciudad" placeholder="Lima / San Isidro" class="form-input" />
            </div>
            <div>
              <label class="form-label">Valoración (1 a 5 ★)</label>
              <select [(ngModel)]="formValoracion" name="valoracion" class="form-input bg-white">
                <option [value]="5">5 ★★★★★ (Excelente)</option>
                <option [value]="4">4 ★★★★☆ (Muy bueno)</option>
                <option [value]="3">3 ★★★☆☆ (Bueno)</option>
                <option [value]="2">2 ★★☆☆☆ (Regular)</option>
                <option [value]="1">1 ★☆☆☆☆ (Deficiente)</option>
              </select>
            </div>
            <div>
              <label class="form-label">Estado *</label>
              <select [(ngModel)]="formEstado" name="estado" class="form-input bg-white">
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar Cambios' : 'Registrar Proveedor' }}</button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal de Confirmación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Eliminar proveedor?"
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
    .avatar-box {
      width: 34px; height: 34px; border-radius: 10px; display: grid;
      place-items: center; font-size: 11px; font-weight: 800; flex: none;
    }
    .avatar-purple { background: #f3e8ff; color: #6b21a8; }
    .avatar-emerald { background: #dcfce7; color: #15803d; }
    .avatar-amber { background: #fef3c7; color: #b45309; }
    .avatar-blue { background: #dbeafe; color: #1e40af; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-slate { background: #f1f5f9; color: #64748b; }
    .action-btn { width: 28px; height: 28px; border-radius: 8px; border: 0; display: inline-grid; place-items: center; cursor: pointer; }
    .page-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: inline-grid; place-items: center; font-weight: bold; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .form-label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .form-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #7c3aed; }
  `]
})
export class ProveedoresComponent {
  readonly dataService = inject(CrudDataService);

  filtroTexto = '';
  filtroEstado = 'Todos';

  columnaOrden = 'nombre';
  ordenAscendente = true;

  paginaActual = signal(1);
  elementosPorPagina = 10;

  modalAbierto = false;
  confirmarAbierto = false;
  editando = false;
  proveedorSeleccionadoId = '';
  proveedorAEliminar: Proveedor | null = null;

  formNombre = '';
  formCategoria = 'Aceites vegetales y extractos';
  formContacto = '';
  formTelefono = '';
  formEmail = '';
  formCiudad = 'Lima';
  formValoracion = 5;
  formEstado: Proveedor['estado'] = 'Activo';

  readonly proveedoresActivos = computed(() => {
    return this.dataService.proveedores().filter((p) => p.estado === 'Activo').length;
  });

  readonly calificacionPromedio = computed(() => {
    const list = this.dataService.proveedores();
    if (!list.length) return '5.0';
    const sum = list.reduce((acc, p) => acc + p.valoracion, 0);
    return (sum / list.length).toFixed(1);
  });

  readonly totalGasto = computed(() => {
    return this.dataService.proveedores().reduce((acc, p) => acc + p.gastoTotal, 0);
  });

  readonly ciudadesTotal = computed(() => {
    return new Set(this.dataService.proveedores().map((p) => p.ciudad).filter(Boolean)).size;
  });

  readonly proveedoresFiltrados = computed(() => {
    let lista = this.dataService.proveedores();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(query) ||
          p.codigo.toLowerCase().includes(query) ||
          p.contacto.toLowerCase().includes(query) ||
          p.ciudad.toLowerCase().includes(query) ||
          p.telefono.toLowerCase().includes(query)
      );
    }

    if (this.filtroEstado !== 'Todos') {
      lista = lista.filter((p) => p.estado === this.filtroEstado);
    }

    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Proveedor] ?? '';
      let valB: any = b[this.columnaOrden as keyof Proveedor] ?? '';
      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? valA - valB : valB - valA;
    });
  });

  readonly totalPaginas = computed(() => Math.ceil(this.proveedoresFiltrados().length / this.elementosPorPagina));
  readonly proveedoresPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.proveedoresFiltrados().slice(inicio, inicio + this.elementosPorPagina);
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
    this.proveedorSeleccionadoId = '';
    this.formNombre = '';
    this.formCategoria = 'Aceites vegetales y extractos';
    this.formContacto = '';
    this.formTelefono = '';
    this.formEmail = '';
    this.formCiudad = 'Lima';
    this.formValoracion = 5;
    this.formEstado = 'Activo';
    this.modalAbierto = true;
  }

  abrirModalEditar(prov: Proveedor): void {
    this.editando = true;
    this.proveedorSeleccionadoId = prov.id;
    this.formNombre = prov.nombre;
    this.formCategoria = prov.categoria;
    this.formContacto = prov.contacto;
    this.formTelefono = prov.telefono;
    this.formEmail = prov.email;
    this.formCiudad = prov.ciudad;
    this.formValoracion = prov.valoracion;
    this.formEstado = prov.estado;
    this.modalAbierto = true;
  }

  guardarProveedor(): void {
    if (!this.formNombre.trim()) return;

    if (this.editando) {
      this.dataService.actualizarProveedor(this.proveedorSeleccionadoId, {
        nombre: this.formNombre.trim(),
        categoria: this.formCategoria.trim(),
        contacto: this.formContacto.trim(),
        telefono: this.formTelefono.trim(),
        email: this.formEmail.trim(),
        ciudad: this.formCiudad.trim(),
        valoracion: Number(this.formValoracion),
        estado: this.formEstado,
      });
    } else {
      this.dataService.crearProveedor({
        nombre: this.formNombre.trim(),
        categoria: this.formCategoria.trim(),
        contacto: this.formContacto.trim(),
        telefono: this.formTelefono.trim(),
        email: this.formEmail.trim(),
        ciudad: this.formCiudad.trim(),
        valoracion: Number(this.formValoracion),
        estado: this.formEstado,
      });
    }
    this.modalAbierto = false;
  }

  get mensajeConfirmarEliminar(): string {
    return `¿Estás segura de retirar a "${this.proveedorAEliminar?.nombre || ''}" de la lista de proveedores?`;
  }

  confirmarEliminar(prov: Proveedor): void {
    this.proveedorAEliminar = prov;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.proveedorAEliminar) {
      this.dataService.eliminarProveedor(this.proveedorAEliminar.id);
      this.proveedorAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Código', 'Empresa', 'Categoría', 'Contacto', 'Teléfono', 'Email', 'Ciudad', 'Valoración', 'Compras', 'Total Comprado S/', 'Estado'];
    const filas = this.dataService.proveedores().map((p) => [
      p.codigo,
      p.nombre,
      p.categoria,
      p.contacto,
      p.telefono,
      p.email,
      p.ciudad,
      p.valoracion,
      p.totalCompras,
      p.gastoTotal.toFixed(2),
      p.estado,
    ]);
    this.dataService.exportarCsv('proveedores_soapyfun', columnas, filas);
  }
}
