import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'soapy-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="login-shell min-h-screen lg:grid lg:grid-cols-2">
      <section class="brand-panel relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div class="brand-orb orb-one"></div><div class="brand-orb orb-two"></div>
        <div class="relative flex items-center gap-3"><div class="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-2xl font-black text-primary-900 shadow-lg">S</div><span class="text-2xl font-extrabold tracking-tight">Soapy<span class="text-yellow-300">FUN</span></span></div>
        <div class="relative max-w-md"><h1 class="text-4xl font-extrabold leading-tight">Tu jabonería artesanal,<br><span class="text-yellow-300">lista para crecer.</span></h1><p class="mt-4 leading-relaxed text-violet-100">Recetas, costos, insumos, pedidos y tu catálogo en un solo lugar.</p><ul class="mt-8 space-y-3 text-sm">@for (benefit of benefits; track benefit) {<li class="flex items-center gap-3"><span class="grid h-6 w-6 place-items-center rounded-full bg-yellow-300 text-xs font-bold text-violet-950">✓</span>{{ benefit }}</li>}</ul></div>
        <p class="relative text-xs text-violet-200">© 2026 <b class="text-white">SoapyFUN</b> · FastAPI · Angular 19 · PostgreSQL</p>
      </section>
      <section class="login-side flex min-h-screen items-center justify-center bg-slate-50 p-5 sm:p-10">
        <div class="w-full max-w-md"><div class="login-card rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-9">
          <div class="mb-7 flex items-center gap-3 lg:hidden"><span class="grid h-11 w-11 place-items-center rounded-xl bg-primary-700 text-xl font-black text-accent-400">S</span><span class="text-xl font-extrabold">Soapy<span class="text-violet-700">FUN</span></span></div>
          <span class="login-kicker">TU TALLER, EN UN SOLO LUGAR</span><h2 class="mt-2 text-2xl font-extrabold text-slate-800">Bienvenida de vuelta</h2><p class="mt-1 text-sm text-slate-500">Ingresa a tu panel de gestión artesanal.</p>
          <form class="mt-7 space-y-4" (ngSubmit)="login()"><div><label class="form-label" for="email">Correo electrónico</label><input class="form-input" id="email" name="email" type="email" autocomplete="username" [(ngModel)]="email" required></div><div><label class="form-label" for="password">Contraseña</label><input class="form-input" id="password" name="password" type="password" autocomplete="current-password" [(ngModel)]="password" required></div>
            @if (error()) {<div class="login-error" role="alert">{{ error() }}</div>}
            <button class="login-submit" type="submit" [disabled]="busy()">@if (busy()) {<span class="spinner"></span>Ingresando…} @else {Iniciar sesión <span>→</span>}</button>
          </form>
          <div class="demo-box mt-6"><p class="demo-heading">ACCESO INICIAL DE SOAPYFUN</p><p><b>Usuario</b> · <code>admin&#64;soapyfun.local</code></p><p><b>Contraseña</b> · <code>SoapyFUN2026!</code></p><small>Credenciales temporales de desarrollo. Cámbialas antes de usar con datos reales.</small></div>
          <p class="mt-6 text-center text-[11px] text-slate-400">Tus fórmulas y los datos de tu negocio son privados.</p>
        </div></div>
      </section>
    </main>
  `,
  styles: [`
    .login-shell{font-family:Roboto,Inter,ui-sans-serif,system-ui,sans-serif}.brand-panel{background:linear-gradient(135deg,#4c1d95 0%,#3b0764 53%,#1e1b4b 100%)}
    .brand-orb{position:absolute;border-radius:999px;filter:blur(45px);pointer-events:none}.orb-one{width:310px;height:310px;right:-85px;top:-95px;background:#facc1530}.orb-two{width:260px;height:260px;left:-110px;bottom:80px;background:#a78bfa35}
    .login-side{background:#f8fafc}.login-kicker{font-size:10px;letter-spacing:.14em;font-weight:800;color:#7c3aed}.form-label{display:block;margin-bottom:6px;font-size:11px;font-weight:700;color:#64748b}.form-input{width:100%;border:1px solid #e2e8f0;border-radius:12px;background:white;padding:12px 14px;font-size:14px;outline:none;transition:.18s}.form-input:focus{border-color:#8b5cf6;box-shadow:0 0 0 3px #8b5cf61c}.login-submit{display:flex;width:100%;align-items:center;justify-content:center;gap:9px;border:0;border-radius:12px;background:#6d28d9;padding:13px;color:white;font-size:14px;font-weight:700;box-shadow:0 5px 14px #6d28d92d;cursor:pointer}.login-submit:hover{background:#5b21b6}.login-submit:disabled{opacity:.65;cursor:wait}.demo-box{border:1px solid #ede9fe;border-radius:13px;background:#f5f3ff;padding:13px 15px;color:#5b21b6;font-size:11px;line-height:1.7}.demo-heading{margin-bottom:5px;font-size:9px;font-weight:800;letter-spacing:.1em;color:#7c3aed}.demo-box code{border-radius:4px;background:#fff;padding:2px 4px;font-family:ui-monospace,monospace}.demo-box small{display:block;margin-top:6px;color:#7c6c8f}.login-error{border:1px solid #fecaca;border-radius:10px;background:#fef2f2;padding:10px 12px;color:#b91c1c;font-size:12px}.spinner{height:15px;width:15px;border:2px solid #ffffff70;border-top-color:white;border-radius:50%;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
  `],
})
export class LoginComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  email = 'admin@soapyfun.local';
  password = 'SoapyFUN2026!';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly benefits = ['Control de insumos y compras por proveedor', 'Recetas y costos con historial', 'Pedidos, clientes y catálogo de tu marca'];

  login(): void {
    this.busy.set(true); this.error.set('');
    this.http.post<{ access_token: string; usuario: { id: number; email: string; nombre: string } }>(`${environment.apiUrl}/api/auth/login`, { email: this.email.trim(), password: this.password }).subscribe({
      next: (result) => { localStorage.setItem('soapyfun_token', result.access_token); localStorage.setItem('soapyfun_usuario', JSON.stringify(result.usuario)); this.busy.set(false); const redirect=this.route.snapshot.queryParamMap.get('redirect'); void this.router.navigateByUrl(redirect || '/dashboard'); },
      error: (err) => { console.error('SoapyFUN login request failed', err); this.busy.set(false); this.error.set(err?.error?.detail || `No se pudo iniciar sesión (HTTP ${err?.status ?? 0}). Verifica que el backend esté ejecutándose en ${environment.apiUrl}.`); },
    });
  }
}
