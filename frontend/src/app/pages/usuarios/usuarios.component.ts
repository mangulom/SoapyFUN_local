import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Usuario } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'soapy-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">EQUIPO Y SEGURIDAD</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Gestión de Usuarios</h1>
          <p class="text-xs text-slate-500 mt-1">Administra el acceso del equipo de taller, formuladoras y asistentes de ventas de SoapyFUN.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cuentas</span>
          <b class="text-2xl font-black text-slate-800">{{ dataService.usuarios().length }}</b>
          <span class="text-[10px] text-slate-500">Miembros del equipo</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activos</span>
          <b class="text-2xl font-black text-emerald-600">{{ contarActivos(true) }}</b>
          <span class="text-[10px] text-slate-500">Con acceso habilitado</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administradoras</span>
          <b class="text-2xl font-black text-amber-600">{{ contarRol('Administradora') }}</b>
          <span class="text-[10px] text-slate-500">Acceso total al sistema</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operación & Ventas</span>
          <b class="text-2xl font-black text-blue-600">{{ contarRol('Asistente de Producción') + contarRol('Operaria de Taller') + contarRol('Vendedora') }}</b>
          <span class="text-[10px] text-slate-500">Producción y atención</span>
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
              placeholder="Buscar por nombre o correo electrónico..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select [(ngModel)]="filtroRol" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los roles</option>
            <option value="Administradora">Administradora</option>
            <option value="Asistente de Producción">Asistente de Producción</option>
            <option value="Operaria de Taller">Operaria de Taller</option>
            <option value="Vendedora">Vendedora</option>
          </select>
          <select [(ngModel)]="filtroEstado" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Inactivos</option>
          </select>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ usuariosFiltrados().length }}</b> usuarios
        </div>
      </div>

      <!-- Tabla CRUD -->
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('nombre')">
                  USUARIO {{ iconoOrden('nombre') }}
                </th>
                <th class="py-3.5 px-4 cursor-pointer hover:text-purple-700" (click)="cambiarOrden('email')">
                  CORREO ELECTRÓNICO {{ iconoOrden('email') }}
                </th>
                <th class="py-3.5 px-4">ROL ASIGNADO</th>
                <th class="py-3.5 px-4 text-center">ESTADO DE ACCESO</th>
                <th class="py-3.5 px-4">REGISTRO</th>
                <th class="py-3.5 px-4">ÚLTIMO ACCESO</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (usuario of usuariosPaginados(); track usuario.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="user-avatar-circle">
                        {{ usuario.iniciales || 'US' }}
                      </div>
                      <div class="font-bold text-slate-850">{{ usuario.nombre }}</div>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-mono text-slate-600">{{ usuario.email }}@if (usuario.empresaNombre) {<small class="block mt-1 font-sans text-[10px] text-slate-400">{{ usuario.empresaNombre }}</small>}</td>
                  <td class="py-3 px-4">
                    <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold" [ngClass]="{
                      'bg-purple-100 text-purple-800': usuario.rol === 'Administradora',
                      'bg-blue-100 text-blue-800': usuario.rol === 'Asistente de Producción',
                      'bg-emerald-100 text-emerald-800': usuario.rol === 'Operaria de Taller',
                      'bg-amber-100 text-amber-800': usuario.rol === 'Vendedora'
                    }">
                      {{ usuario.rol }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <button
                      (click)="dataService.toggleActivoUsuario(usuario.id)"
                      class="pill cursor-pointer transition-transform hover:scale-105"
                      [ngClass]="usuario.activo ? 'pill-green' : 'pill-red'"
                      title="Clic para cambiar estado"
                    >
                      {{ usuario.activo ? '● Activo' : '○ Inactivo' }}
                    </button>
                  </td>
                  <td class="py-3 px-4 text-slate-500">{{ usuario.fechaRegistro }}</td>
                  <td class="py-3 px-4 text-slate-500">{{ usuario.ultimoAcceso }}</td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="abrirModalEditar(usuario)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar usuario">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(usuario)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar cuenta">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">👥</div>
                    <div class="font-medium text-sm text-slate-600">No se encontraron usuarios</div>
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
        [title]="editando ? 'Editar Usuario' : 'Nuevo Usuario del Sistema'"
        [subtitle]="'Asigna rol y permisos para el taller SoapyFUN'"
        [eyebrow]="'SEGURIDAD'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarUsuario()" class="space-y-4">
          <div>
            <label class="form-label">Nombre Completo *</label>
            <input type="text" [(ngModel)]="formNombre" name="nombre" required placeholder="Ej: Camila Torres Vega" class="form-input" />
          </div>

          <div>
            <label class="form-label">Correo Electrónico *</label>
            <input type="email" [(ngModel)]="formEmail" name="email" required placeholder="camila@soapyfun.local" class="form-input" />
          </div>

          @if (esAdmin()) {
            <div>
              <label class="form-label" for="empresa-usuario">Empresa asignada</label>
              <select id="empresa-usuario" [(ngModel)]="formEmpresaId" name="empresaId" class="form-input bg-white" [disabled]="cargandoEmpresas()">
                <option [ngValue]="null">Sin empresa asignada</option>
                @for (empresa of empresas(); track empresa.id) { <option [ngValue]="empresa.id">{{ empresa.name }}</option> }
              </select>
              @if (cargandoEmpresas()) { <small class="mt-1 block text-[10px] text-slate-400">Cargando empresas...</small> }
              @if (errorEmpresas()) { <small class="mt-1 block text-[10px] text-rose-600">{{ errorEmpresas() }}</small> }
            </div>
          } @else if (editando && usuarioEmpresaActual) {
            <div><label class="form-label">Empresa asignada</label><div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">{{ usuarioEmpresaActual }}</div><small class="mt-1 block text-[10px] text-slate-400">Solo un administrador puede cambiar la empresa.</small></div>
          }

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Rol en el Negocio *</label>
              <select [(ngModel)]="formRol" name="rol" class="form-input bg-white">
                <option value="Administradora">Administradora (Acceso completo)</option>
                <option value="Asistente de Producción">Asistente de Producción (Fórmulas e inventario)</option>
                <option value="Operaria de Taller">Operaria de Taller (Lotes y materias primas)</option>
                <option value="Vendedora">Vendedora (Pedidos y catálogo)</option>
              </select>
            </div>
            <div>
              <label class="form-label">Estado de la Cuenta *</label>
              <select [(ngModel)]="formActivo" name="activo" class="form-input bg-white">
                <option [ngValue]="true">Activo (Habilitado)</option>
                <option [ngValue]="false">Inactivo (Suspendido)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="form-label">{{ editando ? 'Nueva Contraseña (dejar en blanco para conservar)' : 'Contraseña Inicial *' }}</label>
            <input type="password" [(ngModel)]="formPassword" name="password" placeholder="Mínimo 8 caracteres" class="form-input" />
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar Cambios' : 'Crear Usuario' }}</button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal Confirmar Eliminación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Eliminar usuario?"
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
    .user-avatar-circle {
      width: 34px; height: 34px; border-radius: 999px; background: #facc15;
      color: #3b0764; font-weight: 900; font-size: 11px; display: grid;
      place-items: center; flex: none;
    }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; border: 0; }
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
export class UsuariosComponent {
  readonly dataService = inject(CrudDataService);
  private readonly http = inject(HttpClient);
  readonly empresas = signal<Array<{ id: number; name: string; is_active: boolean }>>([]);
  readonly cargandoEmpresas = signal(false);
  readonly errorEmpresas = signal('');
  readonly esAdmin = signal(this.usuarioEsAdmin());
  usuarioIdEmpresa: number | null = null;
  formEmpresaId: number | null = null;
  usuarioEmpresaActual = '';

  filtroTexto = '';
  filtroRol = 'Todos';
  filtroEstado = 'Todos';

  columnaOrden = 'nombre';
  ordenAscendente = true;

  paginaActual = signal(1);
  elementosPorPagina = 10;

  modalAbierto = false;
  confirmarAbierto = false;
  editando = false;
  usuarioSeleccionadoId = '';
  usuarioAEliminar: Usuario | null = null;

  formNombre = '';
  formEmail = '';
  formRol: Usuario['rol'] = 'Asistente de Producción';
  formActivo = true;
  formPassword = '';

  constructor() {
    if (this.esAdmin()) this.cargarEmpresas();
  }

  private usuarioEsAdmin(): boolean {
    try {
      const role = JSON.parse(localStorage.getItem('soapyfun_usuario') || '{}').rol;
      return (typeof role === 'string' ? role : role?.nombre || '').toLowerCase().includes('admin');
    } catch {
      return false;
    }
  }

  cargarEmpresas(): void {
    this.cargandoEmpresas.set(true);
    this.errorEmpresas.set('');
    this.http.get<Array<{ id: number; name: string; is_active: boolean }>>('/api/empresas').subscribe({
      next: (items) => { this.empresas.set(items.filter((company) => company.is_active)); this.cargandoEmpresas.set(false); },
      error: (error) => { this.errorEmpresas.set(error?.error?.detail || 'No se pudieron cargar las empresas.'); this.cargandoEmpresas.set(false); },
    });
  }

  contarActivos(activo: boolean): number {
    return this.dataService.usuarios().filter((u) => u.activo === activo).length;
  }

  contarRol(rol: string): number {
    return this.dataService.usuarios().filter((u) => u.rol === rol).length;
  }

  readonly usuariosFiltrados = computed(() => {
    let lista = this.dataService.usuarios();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (u) =>
          u.nombre.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      );
    }

    if (this.filtroRol !== 'Todos') {
      lista = lista.filter((u) => u.rol === this.filtroRol);
    }

    if (this.filtroEstado !== 'Todos') {
      const isActivo = this.filtroEstado === 'Activo';
      lista = lista.filter((u) => u.activo === isActivo);
    }

    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Usuario] ?? '';
      let valB: any = b[this.columnaOrden as keyof Usuario] ?? '';
      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? (valA === valB ? 0 : valA ? 1 : -1) : (valA === valB ? 0 : valA ? -1 : 1);
    });
  });

  readonly totalPaginas = computed(() => Math.ceil(this.usuariosFiltrados().length / this.elementosPorPagina));
  readonly usuariosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.usuariosFiltrados().slice(inicio, inicio + this.elementosPorPagina);
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
    this.usuarioSeleccionadoId = '';
    this.formNombre = '';
    this.formEmail = '';
    this.formRol = 'Asistente de Producción';
    this.formActivo = true;
    this.formPassword = '';
    this.formEmpresaId = this.empresas()[0]?.id ?? null;
    this.usuarioEmpresaActual = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(u: Usuario): void {
    this.editando = true;
    this.usuarioSeleccionadoId = u.id;
    this.formNombre = u.nombre;
    this.formEmail = u.email;
    this.formRol = u.rol;
    this.formActivo = u.activo;
    this.formPassword = '';
    this.formEmpresaId = u.empresaId ?? null;
    this.usuarioIdEmpresa = Number(u.id) || null;
    this.usuarioEmpresaActual = u.empresaNombre || 'Sin empresa asignada';
    this.modalAbierto = true;
  }

  guardarUsuario(): void {
    if (!this.formNombre.trim() || !this.formEmail.trim()) return;

    if (this.editando) {
      this.dataService.actualizarUsuario(this.usuarioSeleccionadoId, {
        nombre: this.formNombre.trim(),
        email: this.formEmail.trim().toLowerCase(),
        rol: this.formRol,
        activo: this.formActivo,
      });
    } else {
      this.dataService.crearUsuario({
        nombre: this.formNombre.trim(),
        email: this.formEmail.trim().toLowerCase(),
        rol: this.formRol,
        activo: this.formActivo,
      });
    }
    const userCompany = this.formEmpresaId;
    if (this.esAdmin() && this.editando && this.usuarioIdEmpresa !== null) {
      this.http.patch(`/api/usuarios/${this.usuarioIdEmpresa}/empresa`, { company_id: userCompany }).subscribe({
        next: (result: any) => {
          this.usuarioEmpresaActual = result?.company_name || '';
          this.modalAbierto = false;
        },
        error: (error) => {
          this.dataService.notify('error', 'No se cambió la empresa', error?.error?.detail || 'No fue posible actualizar la empresa del usuario.');
        },
      });
      return;
    }
    this.modalAbierto = false;
  }

  get mensajeConfirmarEliminar(): string {
    return `¿Estás segura de revocar el acceso a "${this.usuarioAEliminar?.nombre || ''}"?`;
  }

  confirmarEliminar(u: Usuario): void {
    this.usuarioAEliminar = u;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.usuarioAEliminar) {
      this.dataService.eliminarUsuario(this.usuarioAEliminar.id);
      this.usuarioAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Nombre', 'Correo', 'Rol', 'Estado', 'Registro', 'Último Acceso'];
    const filas = this.dataService.usuarios().map((u) => [
      u.nombre,
      u.email,
      u.rol,
      u.activo ? 'Activo' : 'Inactivo',
      u.fechaRegistro,
      u.ultimoAcceso,
    ]);
    this.dataService.exportarCsv('usuarios_soapyfun', columnas, filas);
  }
}
