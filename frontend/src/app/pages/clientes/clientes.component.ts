import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudDataService } from '../../core/services/crud-data.service';
import { Cliente } from '../../core/models/crud.models';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'soapy-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">COMUNIDAD Y FIDELIZACIÓN</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Directorio de Clientes</h1>
          <p class="text-xs text-slate-500 mt-1">Conoce a quienes disfrutan de tus jabones botánicos, su frecuencia de compra y preferencias de aroma.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportar()" class="btn-secondary">
            ↓ Exportar CSV
          </button>
          <button (click)="abrirModalCrear()" class="btn-primary">
            ＋ Nueva Clienta
          </button>
        </div>
      </div>

      <!-- Métricas -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Clientes</span>
          <b class="text-2xl font-black text-slate-800">{{ dataService.clientes().length }}</b>
          <span class="text-[10px] text-slate-500">Comunidad registrada</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientas Frecuentes</span>
          <b class="text-2xl font-black text-amber-600">{{ contarSegmento('Frecuente') }}</b>
          <span class="text-[10px] text-slate-500">2 o más compras</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</span>
          <b class="text-2xl font-black text-emerald-600">S/ {{ ticketPromedio() }}</b>
          <span class="text-[10px] text-slate-500">Por clienta registrada</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mayoristas / Cursos</span>
          <b class="text-2xl font-black text-blue-600">{{ contarSegmento('Mayorista') + contarSegmento('Taller / Alumna') }}</b>
          <span class="text-[10px] text-slate-500">Pedidos especiales y talleres</span>
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
              placeholder="Buscar por nombre, email, teléfono o notas..."
              class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600"
            />
          </div>
          <select [(ngModel)]="filtroSegmento" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700">
            <option value="Todos">Todos los segmentos</option>
            <option value="Nueva">Nuevas</option>
            <option value="Frecuente">Frecuentes</option>
            <option value="Mayorista">Mayoristas</option>
            <option value="Taller / Alumna">Taller / Alumnas</option>
          </select>
        </div>
        <div class="text-xs text-slate-400">
          Mostrando <b>{{ clientesFiltrados().length }}</b> clientas
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
                  CLIENTA {{ iconoOrden('nombre') }}
                </th>
                <th class="py-3.5 px-4">CONTACTO</th>
                <th class="py-3.5 px-4 text-center">SEGMENTO</th>
                <th class="py-3.5 px-4 text-center cursor-pointer hover:text-purple-700" (click)="cambiarOrden('totalPedidos')">
                  PEDIDOS {{ iconoOrden('totalPedidos') }}
                </th>
                <th class="py-3.5 px-4 text-right cursor-pointer hover:text-purple-700" (click)="cambiarOrden('gastoTotal')">
                  GASTO TOTAL {{ iconoOrden('gastoTotal') }}
                </th>
                <th class="py-3.5 px-4 text-center">ÚLTIMA COMPRA</th>
                <th class="py-3.5 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (cliente of clientesPaginados(); track cliente.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-purple-800">{{ cliente.codigo }}</td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <div class="avatar-circle" [ngClass]="'avatar-' + (cliente.color || 'purple')">
                        {{ cliente.iniciales || 'CL' }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-850">{{ cliente.nombre }}</div>
                        <div class="text-[10px] text-slate-400">{{ cliente.ciudad }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <div class="text-slate-800">{{ cliente.email }}</div>
                    <div class="text-[10px] text-slate-400">☎ {{ cliente.telefono }}</div>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="pill" [ngClass]="{
                      'pill-purple': cliente.segmento === 'Frecuente',
                      'pill-blue': cliente.segmento === 'Nueva',
                      'pill-amber': cliente.segmento === 'Mayorista',
                      'pill-green': cliente.segmento === 'Taller / Alumna'
                    }">
                      {{ cliente.segmento }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center font-bold text-slate-800">
                    {{ cliente.totalPedidos }}
                  </td>
                  <td class="py-3 px-4 text-right font-black text-purple-900">
                    S/ {{ cliente.gastoTotal.toFixed(2) }}
                  </td>
                  <td class="py-3 px-4 text-center text-slate-500 whitespace-nowrap">
                    {{ cliente.ultimaCompra }}
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <button (click)="abrirModalEditar(cliente)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar clienta">
                        ✎
                      </button>
                      <button (click)="confirmarEliminar(cliente)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar clienta">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="text-center py-12 text-slate-400">
                    <div class="text-3xl mb-2">🌸</div>
                    <div class="font-medium text-sm text-slate-600">No se encontraron clientas</div>
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
        [title]="editando ? 'Editar Ficha de Clienta' : 'Nueva Clienta'"
        [subtitle]="'Registra a una clienta de tu taller y sus preferencias'"
        [eyebrow]="'COMUNIDAD'"
        (close)="modalAbierto = false"
      >
        <form (ngSubmit)="guardarCliente()" class="space-y-4">
          <div>
            <label class="form-label">Nombre Completo *</label>
            <input type="text" [(ngModel)]="formNombre" name="nombre" required placeholder="Ej: Rocío Nuñez Kikushima" class="form-input" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Correo Electrónico *</label>
              <input type="email" [(ngModel)]="formEmail" name="email" required placeholder="rocio@ejemplo.pe" class="form-input" />
            </div>
            <div>
              <label class="form-label">Teléfono / WhatsApp *</label>
              <input type="text" [(ngModel)]="formTelefono" name="telefono" required placeholder="+51 989 332 110" class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="form-label">Segmento de Clienta *</label>
              <select [(ngModel)]="formSegmento" name="segmento" class="form-input bg-white">
                <option value="Nueva">Nueva (Primera compra)</option>
                <option value="Frecuente">Frecuente (Recompra)</option>
                <option value="Mayorista">Mayorista / Regalos corporativos</option>
                <option value="Taller / Alumna">Taller / Alumna de jabonería</option>
              </select>
            </div>
            <div>
              <label class="form-label">Ciudad / Distrito</label>
              <input type="text" [(ngModel)]="formCiudad" name="ciudad" placeholder="Lima / Miraflores" class="form-input" />
            </div>
          </div>

          <div>
            <label class="form-label">Notas y Preferencias (Aromas, tipo de piel)</label>
            <textarea [(ngModel)]="formNotas" name="notas" rows="2" placeholder="Ej: Prefiere lavanda y caléndula, piel sensible..." class="form-input"></textarea>
          </div>

          <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button type="button" (click)="modalAbierto = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar Cambios' : 'Registrar Clienta' }}</button>
          </div>
        </form>
      </soapy-crud-modal>

      <!-- Modal de Confirmación -->
      <soapy-confirm-dialog
        [isOpen]="confirmarAbierto"
        title="¿Eliminar clienta?"
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
    .avatar-circle {
      width: 34px; height: 34px; border-radius: 999px; display: grid;
      place-items: center; font-size: 11px; font-weight: 800; flex: none;
    }
    .avatar-purple { background: #f3e8ff; color: #6b21a8; }
    .avatar-violet { background: #ede9fe; color: #5b21b6; }
    .avatar-amber { background: #fef3c7; color: #b45309; }
    .avatar-emerald { background: #dcfce7; color: #15803d; }
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .pill-purple { background: #f3e8ff; color: #6b21a8; }
    .pill-blue { background: #dbeafe; color: #1e40af; }
    .pill-amber { background: #fef3c7; color: #b45309; }
    .pill-green { background: #dcfce7; color: #15803d; }
    .action-btn { width: 28px; height: 28px; border-radius: 8px; border: 0; display: inline-grid; place-items: center; cursor: pointer; }
    .page-btn { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer; display: inline-grid; place-items: center; font-weight: bold; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .form-label { display: block; font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 4px; }
    .form-input { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #7c3aed; }
  `]
})
export class ClientesComponent {
  readonly dataService = inject(CrudDataService);

  filtroTexto = '';
  filtroSegmento = 'Todos';

  columnaOrden = 'nombre';
  ordenAscendente = true;

  paginaActual = signal(1);
  elementosPorPagina = 10;

  modalAbierto = false;
  confirmarAbierto = false;
  editando = false;
  clienteSeleccionadoId = '';
  clienteAEliminar: Cliente | null = null;

  formNombre = '';
  formEmail = '';
  formTelefono = '';
  formSegmento: Cliente['segmento'] = 'Nueva';
  formCiudad = 'Lima';
  formNotas = '';

  contarSegmento(segmento: string): number {
    return this.dataService.clientes().filter((c) => c.segmento === segmento).length;
  }

  readonly ticketPromedio = computed(() => {
    const list = this.dataService.clientes();
    if (!list.length) return '0.00';
    const sum = list.reduce((acc, c) => acc + c.gastoTotal, 0);
    return (sum / list.length).toFixed(2);
  });

  readonly clientesFiltrados = computed(() => {
    let lista = this.dataService.clientes();
    const query = this.filtroTexto.trim().toLowerCase();

    if (query) {
      lista = lista.filter(
        (c) =>
          c.nombre.toLowerCase().includes(query) ||
          c.codigo.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.telefono.toLowerCase().includes(query) ||
          (c.notas && c.notas.toLowerCase().includes(query))
      );
    }

    if (this.filtroSegmento !== 'Todos') {
      lista = lista.filter((c) => c.segmento === this.filtroSegmento);
    }

    return [...lista].sort((a, b) => {
      let valA: any = a[this.columnaOrden as keyof Cliente] ?? '';
      let valB: any = b[this.columnaOrden as keyof Cliente] ?? '';
      if (typeof valA === 'string') {
        return this.ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.ordenAscendente ? valA - valB : valB - valA;
    });
  });

  readonly totalPaginas = computed(() => Math.ceil(this.clientesFiltrados().length / this.elementosPorPagina));
  readonly clientesPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    return this.clientesFiltrados().slice(inicio, inicio + this.elementosPorPagina);
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
    this.clienteSeleccionadoId = '';
    this.formNombre = '';
    this.formEmail = '';
    this.formTelefono = '+51 ';
    this.formSegmento = 'Nueva';
    this.formCiudad = 'Lima';
    this.formNotas = '';
    this.modalAbierto = true;
  }

  abrirModalEditar(cli: Cliente): void {
    this.editando = true;
    this.clienteSeleccionadoId = cli.id;
    this.formNombre = cli.nombre;
    this.formEmail = cli.email;
    this.formTelefono = cli.telefono;
    this.formSegmento = cli.segmento;
    this.formCiudad = cli.ciudad;
    this.formNotas = cli.notas || '';
    this.modalAbierto = true;
  }

  guardarCliente(): void {
    if (!this.formNombre.trim()) return;

    if (this.editando) {
      this.dataService.actualizarCliente(this.clienteSeleccionadoId, {
        nombre: this.formNombre.trim(),
        email: this.formEmail.trim(),
        telefono: this.formTelefono.trim(),
        segmento: this.formSegmento,
        ciudad: this.formCiudad.trim(),
        notas: this.formNotas.trim(),
      });
    } else {
      this.dataService.crearCliente({
        nombre: this.formNombre.trim(),
        email: this.formEmail.trim(),
        telefono: this.formTelefono.trim(),
        segmento: this.formSegmento,
        ciudad: this.formCiudad.trim(),
        notas: this.formNotas.trim(),
      });
    }
    this.modalAbierto = false;
  }

  get mensajeConfirmarEliminar(): string {
    return `¿Estás segura de retirar a "${this.clienteAEliminar?.nombre || ''}" de la comunidad?`;
  }

  confirmarEliminar(cli: Cliente): void {
    this.clienteAEliminar = cli;
    this.confirmarAbierto = true;
  }

  eliminarConfirmado(): void {
    if (this.clienteAEliminar) {
      this.dataService.eliminarCliente(this.clienteAEliminar.id);
      this.clienteAEliminar = null;
    }
    this.confirmarAbierto = false;
  }

  exportar(): void {
    const columnas = ['Código', 'Clienta', 'Email', 'Teléfono', 'Segmento', 'Pedidos', 'Gasto Total S/', 'Última Compra', 'Ciudad'];
    const filas = this.dataService.clientes().map((c) => [
      c.codigo,
      c.nombre,
      c.email,
      c.telefono,
      c.segmento,
      c.totalPedidos,
      c.gastoTotal.toFixed(2),
      c.ultimaCompra,
      c.ciudad,
    ]);
    this.dataService.exportarCsv('clientes_soapyfun', columnas, filas);
  }
}
