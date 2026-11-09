import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudModalComponent } from '../../shared/components/crud-modal/crud-modal.component';

interface Company {
  id: number;
  name: string;
  ruc: string | null;
  dni: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
}

type CompanyPayload = Omit<Company, 'id'>;

@Component({
  selector: 'soapy-empresas',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudModalComponent, ConfirmDialogComponent],
  template: `
    <div class="crud-page">
      <div class="page-head flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">ADMINISTRACI&Oacute;N</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Gesti&oacute;n de Empresas</h1>
          <p class="text-xs text-slate-500 mt-1">Administra los datos fiscales, contacto y estado de cada empresa.</p>
        </div>
        <button class="btn-primary" (click)="newCompany()">+ Nueva Empresa</button>
      </div>

      @if (error()) { <p class="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800" role="alert">{{ error() }}</p> }
      @if (loadError()) { <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800" role="alert"><span>{{ loadError() }}</span><button type="button" class="btn-secondary" (click)="load()">Reintentar</button></div> }

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600"><span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Empresas</span><b class="text-2xl font-black text-slate-800">{{ companies().length }}</b><span class="text-[10px] text-slate-500">Registradas en el sistema</span></div>
        <div class="stat-card border-l-4 border-l-emerald-500"><span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activas</span><b class="text-2xl font-black text-emerald-600">{{ activeCount() }}</b><span class="text-[10px] text-slate-500">Con acceso habilitado</span></div>
        <div class="stat-card border-l-4 border-l-amber-500"><span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Con RUC</span><b class="text-2xl font-black text-amber-600">{{ rucCount() }}</b><span class="text-[10px] text-slate-500">Identificaci&oacute;n fiscal registrada</span></div>
        <div class="stat-card border-l-4 border-l-blue-500"><span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inactivas</span><b class="text-2xl font-black text-blue-600">{{ companies().length - activeCount() }}</b><span class="text-[10px] text-slate-500">Sin acceso habilitado</span></div>
      </div>

      <div class="card p-4 mb-4 flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div class="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
          <div class="relative flex-1 max-w-md">
            <svg class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>
            <input type="search" [(ngModel)]="search" placeholder="Buscar empresa, RUC o correo..." class="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" />
          </div>
          <select [ngModel]="statusFilter" (ngModelChange)="statusFilter = $event" class="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"><option value="Todos">Todos los estados</option><option value="Activa">Activas</option><option value="Inactiva">Inactivas</option></select>
        </div>
        <div class="text-xs text-slate-400">Mostrando <b>{{ filteredCompanies().length }}</b> de {{ companies().length }}</div>
      </div>

      @if (!loading() && loadError()) { <div class="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-6 text-center"><p class="text-sm font-semibold text-rose-800">No se pudieron cargar las empresas</p><p class="mt-1 text-xs text-rose-700">{{ loadError() }}</p><button type="button" class="btn-secondary mt-4" (click)="load()">Reintentar</button></div> }

      <section class="card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        @if (loading()) { <div class="px-4 py-3 border-b border-slate-100 text-xs text-slate-500">Cargando empresas...</div> }
        @if (!loadError()) { <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead><tr class="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100"><th class="py-3.5 px-4">EMPRESA</th><th class="py-3.5 px-4">RUC / DNI</th><th class="py-3.5 px-4">CONTACTO</th><th class="py-3.5 px-4 text-center">ESTADO</th><th class="py-3.5 px-4 text-right">ACCIONES</th></tr></thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              @for (company of filteredCompanies(); track company.id) {
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4"><div class="font-bold text-slate-850">{{ company.name }}</div><small class="block text-[10px] text-slate-400">EMP-{{ company.id }} <span class="mx-1">&middot;</span>{{ company.address || 'Sin direcci&oacute;n' }}</small></td>
                  <td class="py-3 px-4"><div class="font-mono font-semibold text-purple-800">{{ company.ruc || '&mdash;' }}</div><small class="text-[10px] text-slate-400">DNI {{ company.dni || '&mdash;' }}</small></td>
                  <td class="py-3 px-4"><div>{{ company.email || '&mdash;' }}</div><small class="block text-[10px] text-slate-400">{{ company.phone || 'Sin tel&eacute;fono' }}</small></td>
                  <td class="py-3 px-4 text-center"><span class="pill" [class.pill-green]="company.is_active" [class.pill-red]="!company.is_active">{{ company.is_active ? 'Activa' : 'Inactiva' }}</span></td>
                  <td class="py-3 px-4 text-right"><div class="flex items-center justify-end gap-1.5"><button type="button" (click)="edit(company)" class="action-btn text-purple-700 hover:bg-purple-50" title="Editar empresa" aria-label="Editar empresa"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z"/></svg></button><button type="button" (click)="remove(company)" class="action-btn text-rose-600 hover:bg-rose-50" title="Eliminar empresa" aria-label="Eliminar empresa"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg></button></div></td>
                </tr>
              } @empty {
                @if (!loading() && !loadError()) { <tr><td colspan="5" class="text-center py-12 text-slate-400"><div class="mb-2 text-3xl">&#9724;</div><div class="font-medium text-sm text-slate-600">No se encontraron empresas</div><div class="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o registra una empresa nueva.</div></td></tr> }
              }
            </tbody>
          </table>
        </div> }
      </section>

      <soapy-crud-modal [isOpen]="open()" [title]="editing() ? 'Editar empresa' : 'Nueva empresa'" [subtitle]="editing() ? 'Actualiza los datos de la empresa' : 'Registra los datos fiscales y de contacto'" [eyebrow]="'ADMINISTRACI&Oacute;N'" size="lg" (close)="closeModal()">
        <form (ngSubmit)="save()" class="space-y-4">
          @if (formError()) { <p class="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800" role="alert">{{ formError() }}</p> }
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label class="form-label" for="company-name">Raz&oacute;n social / nombre *</label><input id="company-name" name="name" [(ngModel)]="form.name" required maxlength="160" placeholder="Nombre de la empresa" class="form-input" /></div>
            <div><label class="form-label" for="company-ruc">RUC <span class="font-normal text-slate-400">(11 d&iacute;gitos)</span></label><input id="company-ruc" name="ruc" [(ngModel)]="form.ruc" inputmode="numeric" maxlength="11" pattern="[0-9]{11}" placeholder="Ej. 20123456789" class="form-input" /></div>
            <div><label class="form-label" for="company-dni">DNI <span class="font-normal text-slate-400">(8 d&iacute;gitos)</span></label><input id="company-dni" name="dni" [(ngModel)]="form.dni" inputmode="numeric" maxlength="8" pattern="[0-9]{8}" placeholder="Opcional" class="form-input" /></div>
            <div><label class="form-label" for="company-email">Correo electr&oacute;nico</label><input id="company-email" name="email" [(ngModel)]="form.email" type="email" maxlength="254" placeholder="contacto@empresa.pe" class="form-input" /></div>
            <div><label class="form-label" for="company-phone">Tel&eacute;fono</label><input id="company-phone" name="phone" [(ngModel)]="form.phone" maxlength="40" placeholder="Tel&eacute;fono de contacto" class="form-input" /></div>
            <div><label class="form-label" for="company-address">Direcci&oacute;n</label><input id="company-address" name="address" [(ngModel)]="form.address" maxlength="255" placeholder="Direcci&oacute;n fiscal o comercial" class="form-input" /></div>
          </div>
          <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" name="is_active" [(ngModel)]="form.is_active" class="accent-purple-700" /> Empresa activa</label>
          @if (saving()) { <p class="text-xs text-violet-700">Guardando empresa...</p> }
          <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-5"><button type="button" (click)="closeModal()" class="btn-secondary">Cancelar</button><button type="submit" [disabled]="saving()" class="btn-primary">{{ saving() ? 'Guardando...' : editing() ? 'Guardar cambios' : 'Crear empresa' }}</button></div>
        </form>
      </soapy-crud-modal>
      <soapy-confirm-dialog [isOpen]="deleteTarget() !== null" title="Eliminar empresa" [message]="deleteMessage()" confirmText="Eliminar" (confirm)="confirmRemove()" (cancel)="deleteTarget.set(null)"></soapy-confirm-dialog>
    </div>
  `,
  styles: [`
    .crud-page { font-family: Roboto, Inter, system-ui, sans-serif; }
    .stat-card { background:white; padding:14px 16px; border-radius:14px; border:1px solid #f1f5f9; display:flex; flex-direction:column; gap:4px; box-shadow:0 1px 3px rgba(0,0,0,.02); }
    .btn-primary { background:#facc15; color:#3b0764; font-weight:700; font-size:12px; padding:9px 16px; border-radius:10px; border:0; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all .15s; }
    .btn-primary:hover { background:#eab308; }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .btn-secondary { background:white; color:#475569; font-weight:600; font-size:12px; padding:9px 14px; border-radius:10px; border:1px solid #e2e8f0; cursor:pointer; transition:all .15s; }
    .btn-secondary:hover { background:#f8fafc; color:#1e293b; }
    .form-label { display:block; font-size:11px; font-weight:700; color:#475569; margin-bottom:4px; }
    .form-input { width:100%; border:1px solid #cbd5e1; border-radius:10px; padding:8px 12px; font-size:13px; outline:none; transition:border-color .15s; }
    .form-input:focus { border-color:#7c3aed; box-shadow:0 0 0 2px #7c3aed18; }
    .pill { display:inline-block; padding:3px 8px; border-radius:999px; font-size:10px; font-weight:700; }
    .pill-green { background:#dcfce7; color:#15803d; }
    .pill-red { background:#fee2e2; color:#b91c1c; }
    .action-btn { width:28px; height:28px; border-radius:8px; border:0; display:inline-grid; place-items:center; cursor:pointer; font-size:13px; background:transparent; }
    @media (max-width:640px) { .page-head { align-items:flex-start; } }
  `],
})
export class EmpresasComponent {
  private readonly http = inject(HttpClient);
  readonly companies = signal<Company[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly open = signal(false);
  readonly editing = signal<number | null>(null);
  readonly error = signal('');
  readonly loadError = signal('');
  readonly formError = signal('');
  search = '';
  statusFilter = 'Todos';
  readonly deleteTarget = signal<Company | null>(null);
  readonly activeCount = computed(() => this.companies().filter((company) => company.is_active).length);
  readonly rucCount = computed(() => this.companies().filter((company) => !!company.ruc).length);
  readonly filteredCompanies = computed(() => {
    const term = this.search.trim().toLocaleLowerCase('es');
    const status = this.statusFilter;
    return this.companies().filter((company) => {
      const matchesSearch = !term || [company.name, company.ruc, company.dni, company.email, company.phone, company.address]
        .some((value) => value?.toLocaleLowerCase('es').includes(term));
      const matchesStatus = status === 'Todos' || (status === 'Activa' ? company.is_active : !company.is_active);
      return matchesSearch && matchesStatus;
    });
  });
  readonly deleteMessage = computed(() => {
    const company = this.deleteTarget();
    return company ? `¿Eliminar “${company.name}”? Solo se permite si no tiene usuarios ni registros asociados.` : '';
  });
  form: CompanyPayload = this.emptyForm();

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.loadError.set('');
    this.http.get<unknown>('/api/empresas').subscribe({
      next: (response) => {
        const payload = Array.isArray(response) ? response : (response as { items?: unknown[]; empresas?: unknown[]; data?: unknown[] })?.items ?? (response as { empresas?: unknown[] })?.empresas ?? (response as { data?: unknown[] })?.data ?? [];
        const companies = payload.map((item: any) => ({
          id: Number(item.id),
          name: String(item.name ?? item.nombre ?? ''),
          ruc: item.ruc ?? null,
          dni: item.dni ?? null,
          address: item.address ?? item.direccion ?? null,
          phone: item.phone ?? item.telefono ?? null,
          email: item.email ?? item.correo ?? null,
          is_active: Boolean(item.is_active ?? item.activo ?? true),
        })).filter((company) => Number.isFinite(company.id) && !!company.name);
        this.companies.set(companies);
        this.loading.set(false);
      },
      error: (err) => {
        if (err?.status === 401) {
          localStorage.removeItem('soapyfun_token');
          localStorage.removeItem('soapyfun_usuario');
          this.loadError.set('La sesi?n guardada caduc? o pertenece a otra instancia del backend. Inicia sesi?n nuevamente.');
          window.location.assign('/login');
        } else {
          this.loadError.set(this.apiError(err, 'No fue posible cargar las empresas.'));
        }
        this.loading.set(false);
      },
    });
  }

  newCompany(): void { this.editing.set(null); this.form = this.emptyForm(); this.open.set(true); this.error.set(''); this.formError.set(''); }

  edit(company: Company): void {
    this.editing.set(company.id);
    this.form = { name: company.name, ruc: company.ruc || '', dni: company.dni || '', address: company.address || '', phone: company.phone || '', email: company.email || '', is_active: company.is_active };
    this.open.set(true);
    this.error.set('');
    this.formError.set('');
  }

  save(): void {
    const payload: CompanyPayload = { ...this.form, name: this.form.name.trim(), ruc: this.form.ruc?.trim() || null, dni: this.form.dni?.trim() || null, address: this.form.address?.trim() || null, phone: this.form.phone?.trim() || null, email: this.form.email?.trim() || null };
    if (!payload.name) { this.formError.set('El nombre o razón social es obligatorio.'); return; }
    if (payload.ruc && !/^\d{11}$/.test(payload.ruc)) { this.formError.set('El RUC debe tener exactamente 11 dígitos.'); return; }
    if (payload.dni && !/^\d{8}$/.test(payload.dni)) { this.formError.set('El DNI debe tener exactamente 8 dígitos.'); return; }
    this.saving.set(true);
    this.error.set('');
    this.formError.set('');
    const id = this.editing();
    const request = id === null
      ? this.http.post<Company>('/api/empresas', payload)
      : this.http.put<Company>(`/api/empresas/${id}`, payload);
    request.subscribe({
      next: () => { this.saving.set(false); this.open.set(false); this.load(); },
      error: (err) => { this.saving.set(false); this.formError.set(this.apiError(err, 'No se pudo guardar la empresa.')); },
    });
  }

  remove(company: Company): void { this.deleteTarget.set(company); }

  confirmRemove(): void {
    const company = this.deleteTarget();
    if (!company) return;
    this.error.set('');
    this.http.delete<void>(`/api/empresas/${company.id}`).subscribe({
      next: () => { this.deleteTarget.set(null); this.load(); },
      error: (err) => { this.deleteTarget.set(null); this.error.set(this.apiError(err, 'No se pudo eliminar la empresa.')); },
    });
  }

  closeModal(): void { if (!this.saving()) this.open.set(false); }

  private apiError(error: any, fallback: string): string {
    if (error?.status === 0) return 'No hay conexión con el servidor. Verifica que el backend esté iniciado.';
    if (error?.status === 401) return 'Tu sesión venció o no es válida. Cierra sesión e inicia nuevamente.';
    if (error?.status === 403) return error?.error?.detail || 'Tu usuario no tiene permiso de administrador para gestionar empresas.';
    return error?.error?.detail || fallback;
  }

  private emptyForm(): CompanyPayload { return { name: '', ruc: '', dni: '', address: '', phone: '', email: '', is_active: true }; }
}
