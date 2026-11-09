import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { CrudDataService } from '../../core/services/crud-data.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="dashboard-page">
      <div class="dash-heading">
        <div>
          <span class="dash-eyebrow">JABONERÍA DE ROCÍO</span>
          <h1>{{currentSection() === 'Panel de Administración' ? greeting() + ', Rocío' : currentSection()}} <span>✳</span></h1>
          <p>{{currentSection() === 'Panel de Administración' ? 'Este es el resumen en tiempo real para tu taller de jabonería artesanal.' : 'Administra ' + currentSection().toLowerCase() + ' de tu jabonería artesanal.'}}</p>
        </div>
        <button class="dash-primary" (click)="go('Productos')">＋ Nuevo producto</button>
      </div>

      <section class="dash-metrics" *ngIf="currentSection() === 'Panel de Administración'">
        <article class="cursor-pointer" (click)="go('Pedidos')">
          <small>VENTAS TOTALES</small>
          <b>S/ {{ dataService.totalVentas().toFixed(2) }}</b>
          <span class="good">↗ {{ dataService.pedidos().length }} órdenes en sistema</span>
        </article>
        <article class="cursor-pointer" (click)="go('Pedidos')">
          <small>PEDIDOS ABIERTOS</small>
          <b>{{ dataService.pedidosAbiertos().length.toString().padStart(2, '0') }} <i>pedidos</i></b>
          <span class="warn">Por preparar / en camino</span>
        </article>
        <article class="cursor-pointer" (click)="go('Productos')">
          <small>PRODUCTOS ACTIVOS</small>
          <b>{{ dataService.productosActivos().length.toString().padStart(2, '0') }} <i>productos</i></b>
          <span>{{ dataService.productosBajoStock().length }} con poco stock</span>
        </article>
        <article class="cursor-pointer" (click)="go('Insumos')">
          <small>VALOR DE ALMACÉN</small>
          <b>S/ {{ dataService.valorInventarioInsumos().toFixed(2) }}</b>
          <span>{{ dataService.insumos().length }} insumos registrados</span>
        </article>
      </section>

      <section class="dash-columns" *ngIf="currentSection() === 'Panel de Administración'">
        <article class="dash-card">
          <header>
            <div>
              <h2>Ventas y pedidos</h2>
              <p>Un vistazo a cómo se mueve tu taller</p>
            </div>
            <button (click)="go('Pedidos')">Ver pedidos →</button>
          </header>
          <div class="sales-total">
            S/ {{ dataService.totalVentas().toFixed(2) }} <span>↗ 100% verificado</span>
            <small>en tu historial comercial</small>
          </div>
          <div class="sales-chart">
            <div class="chart-grid">
              <i></i><i></i><i></i><i></i>
              <svg viewBox="0 0 700 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#8b5cf6" stop-opacity=".22"/>
                    <stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0 122 C45 109 58 88 103 96 S157 115 205 81 S263 67 302 86 S364 99 402 61 S468 70 505 48 S564 68 603 39 S658 48 700 18 V150 H0Z" fill="url(#sales-fill)"/>
                <path d="M0 122 C45 109 58 88 103 96 S157 115 205 81 S263 67 302 86 S364 99 402 61 S468 70 505 48 S564 68 603 39 S658 48 700 18" fill="none" stroke="#7c3aed" stroke-width="3" vector-effect="non-scaling-stroke"/>
              </svg>
            </div>
          </div>
          <div class="chart-days">
            <span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span>
          </div>
        </article>

        <article class="dash-card">
          <header>
            <div>
              <h2>Actividad reciente</h2>
              <p>Lo que pasa en tu taller</p>
            </div>
            <button (click)="go('Pedidos')">Ver todo →</button>
          </header>
          <div class="activity">
            @for (p of dataService.pedidos().slice(0, 3); track p.id) {
              <div>
                <i class="activity-dot purple-dot">↗</i>
                <p>
                  <b>Pedido {{ p.codigo }} recibido</b>
                  <small>{{ p.clienteNombre }} · {{ p.itemsResumen }}</small>
                </p>
                <time>{{ p.fecha }}</time>
              </div>
            }
            @for (ins of dataService.insumosBajoStock().slice(0, 1); track ins.id) {
              <div>
                <i class="activity-dot amber-dot">↓</i>
                <p>
                  <b>Insumo por reponer</b>
                  <small>{{ ins.nombre }} · {{ ins.stock }} {{ ins.unidad }} restantes</small>
                </p>
                <time>Alerta</time>
              </div>
            }
          </div>
        </article>
      </section>

      <section class="dash-columns bottom-dash" *ngIf="currentSection() === 'Panel de Administración'">
        <article class="dash-card">
          <header>
            <div>
              <h2>Pedidos recientes</h2>
              <p>Gestiona los pedidos de tu tienda</p>
            </div>
            <button (click)="go('Pedidos')">Ver todos →</button>
          </header>
          <div class="orders-table">
            <div class="orders-head">
              <span>PEDIDO</span>
              <span>CLIENTE</span>
              <span>CANAL</span>
              <span>TOTAL</span>
              <span>ESTADO</span>
            </div>
            @for (order of dataService.pedidos().slice(0, 4); track order.id) {
              <div class="orders-row cursor-pointer" (click)="go('Pedidos')">
                <b>{{ order.codigo }}</b>
                <span>{{ order.clienteNombre }}</span>
                <span>{{ order.canal }}</span>
                <b>S/ {{ order.total.toFixed(2) }}</b>
                <em>{{ order.estado }}</em>
              </div>
            }
          </div>
        </article>

        <article class="dash-card">
          <header>
            <div>
              <h2>Productos en vitrina</h2>
              <p>Catálogo de jabones artesanales</p>
            </div>
            <button (click)="go('Productos')">Catálogo →</button>
          </header>
          @for (prod of dataService.productos().slice(0, 4); track prod.id) {
            <div class="popular cursor-pointer" (click)="go('Productos')">
              <span class="soap-chip" [ngClass]="'soap-' + (prod.tono || 'lavender')">{{ prod.icono || '🧼' }}</span>
              <div>
                <b>{{ prod.nombre }}</b>
                <small>{{ prod.categoria }} · Stock: {{ prod.stock }} u.</small>
                <i><u [style.width.%]="calcularBarra(prod.stock)"></u></i>
              </div>
              <strong>S/ {{ prod.precio.toFixed(2) }}</strong>
            </div>
          }
        </article>
      </section>

      @if (currentSection().toLowerCase().includes('ia') || currentSection().toLowerCase().includes('pron') || currentSection().toLowerCase().includes('recomendador') || currentSection().toLowerCase().includes('rentabilidad') || currentSection().toLowerCase().includes('alertas') || currentSection().toLowerCase().includes('copiloto') || currentSection().toLowerCase().includes('lectura') || currentSection().toLowerCase().includes('modelos')) {
        <a class="mb-5 inline-flex rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white" href="/dashboard/asistente-soapyfun-ai">Abrir centro de IA con an?lisis en tiempo real ?</a>
      }
      @if (currentSection().toLowerCase().includes('ia') || currentSection().toLowerCase().includes('pronóstico') || currentSection().toLowerCase().includes('recomendador') || currentSection().toLowerCase().includes('rentabilidad') || currentSection().toLowerCase().includes('alertas') || currentSection().toLowerCase().includes('copiloto') || currentSection().toLowerCase().includes('lectura') || currentSection().toLowerCase().includes('modelos')) {
        <section class="ai-console">
          <header>
            <div>
              <span>SOAPYFUN INTELLIGENCE</span>
              <h2>{{currentSection()}}</h2>
              <p>Asistencia para tu operación con datos revisables y cálculos transparentes.</p>
            </div>
            <b class="ai-status">● IA DE APOYO</b>
          </header>
          <div class="ai-grid">
            <article>
              <span>01 · CONTEXTO</span>
              <b>Datos del negocio en tiempo real</b>
              <p>{{ dataService.productos().length }} productos, {{ dataService.insumos().length }} insumos y {{ dataService.pedidos().length }} pedidos activos conectados.</p>
            </article>
            <article>
              <span>02 · ANÁLISIS</span>
              <b>Recomendaciones explicables</b>
              <p>Las sugerencias mostrarán datos usados, supuestos, fecha y nivel de confianza.</p>
            </article>
            <article>
              <span>03 · CONTROL</span>
              <b>Revisión humana</b>
              <p>La IA no cambia precios, compras, fórmulas ni inventario sin confirmación.</p>
            </article>
          </div>
          <div class="ai-prompt">
            <div class="ai-orb">✦</div>
            <div>
              <b>Copiloto para jabonería artesanal</b>
              <p>Consulta márgenes, demanda, compras o formulación con los datos de Rocío Nuñez Kikushima.</p>
            </div>
            <button (click)="go('Reportes')">Abrir reportes →</button>
          </div>
          <aside class="ai-safety">La IA orienta; no reemplaza validación química, seguridad de fabricación ni reglas tributarias locales.</aside>
        </section>
      }
    </main>
  `,
  styles: [`
    .dashboard-page{max-width:1600px;margin:0 auto;min-width:0}.dash-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:0 0 22px}.dash-eyebrow{color:#8766b9;font-size:9px;font-weight:800;letter-spacing:.15em}.dash-heading h1{margin:7px 0 0;font-size:clamp(25px,3vw,33px);font-weight:750;letter-spacing:-.04em}.dash-heading h1 span{color:#eab308}.dash-heading p{margin:5px 0 0;color:#64748b;font-size:12px}.dash-primary{border:0;border-radius:11px;background:#facc15;padding:11px 16px;color:#4c1d95;font-size:12px;font-weight:700;box-shadow:0 4px 12px #d8a70020;cursor:pointer}.dash-primary:hover{background:#eab308}.dash-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.dash-metrics article,.dash-card{border:1px solid #edf0f5;border-radius:15px;background:#fff;box-shadow:0 2px 8px #30203e08}.dash-metrics article{display:flex;min-height:112px;flex-direction:column;gap:8px;padding:16px 18px;border-left:3px solid #3b82f6}.dash-metrics article:nth-child(2){border-left-color:#22c55e}.dash-metrics article:nth-child(3){border-left-color:#eab308}.dash-metrics article:nth-child(4){border-left-color:#ef4444}.dash-metrics small{color:#64748b;font-size:9px;font-weight:700;letter-spacing:.09em}.dash-metrics b{font-size:25px;letter-spacing:-.04em;color:#1d4ed8}.dash-metrics article:nth-child(2) b{color:#15803d}.dash-metrics article:nth-child(3) b{color:#ca8a04}.dash-metrics article:nth-child(4) b{color:#dc2626}.dash-metrics b i{font-size:11px;font-style:normal;font-weight:500;color:#64748b}.dash-metrics article span{font-size:9px;color:#64748b}.dash-metrics article .good{color:#dc2626}.dash-metrics article .warn{color:#64748b}.dash-columns{display:grid;grid-template-columns:minmax(0,2.15fr) minmax(310px,1fr);gap:18px;margin-bottom:18px}.dash-card{min-width:0;padding:18px}.dash-card>header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:15px}.dash-card h2{font-size:14px;font-weight:750;color:#1e293b}.dash-card header p{margin-top:4px;color:#64748b;font-size:10px}.dash-card header button{border:0;background:transparent;padding:5px;color:#1d4ed8;font-size:10px;cursor:pointer}.sales-total{font-size:22px;font-weight:750}.sales-total span{margin-left:8px;color:#dc2626;font-size:10px}.sales-total small{margin-left:6px;color:#64748b;font-size:9px;font-weight:400}.sales-chart{height:180px;margin-top:10px;padding-left:7px}.chart-grid{position:relative;height:100%}.chart-grid>i{position:absolute;right:0;left:0;border-top:1px solid #f1f5f9}.chart-grid>i:nth-child(1){top:0}.chart-grid>i:nth-child(2){top:33%}.chart-grid>i:nth-child(3){top:66%}.chart-grid>i:nth-child(4){top:100%}.chart-grid svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.chart-days{display:flex;justify-content:space-between;margin:8px 0 0 7px;color:#64748b;font-size:8px}.activity{display:flex;flex-direction:column}.activity>div{display:flex;align-items:center;gap:10px;border:1px solid #edf0f5;border-radius:12px;margin:0 0 8px;padding:10px}.activity>div:first-child{border-top:1px solid #edf0f5;padding-top:10px}.activity-dot{display:grid;width:36px;height:36px;flex:none;place-items:center;border-radius:10px;font-size:13px;font-style:normal;font-weight:700}.purple-dot{background:#facc15;color:#4c1d95}.amber-dot{background:#7c3aed;color:white}.green-dot{background:#a855f7;color:white}.pink-dot{background:#a855f7;color:white}.activity p{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}.activity b{overflow:hidden;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.activity small{overflow:hidden;color:#64748b;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.activity time{align-self:flex-start;color:#64748b;font-size:8px}.orders-table{overflow:auto}.orders-head,.orders-row{display:grid;grid-template-columns:1fr 1.5fr 1.2fr .9fr 1fr;align-items:center;gap:9px;min-width:520px}.orders-head{background:#f8fafc;padding:10px;font-size:8px;font-weight:700;letter-spacing:.08em;color:#64748b}.orders-row{border-bottom:1px solid #f1f5f9;padding:12px 10px;font-size:9px;color:#475569}.orders-row>b:first-child{color:#1d4ed8}.orders-row em{width:max-content;border-radius:20px;background:#dbeafe;padding:5px 7px;color:#1d4ed8;font-size:8px;font-style:normal;font-weight:700}.popular{display:flex;align-items:center;gap:10px;padding:9px 0}.soap-chip{display:grid;width:38px;height:38px;flex:none;place-items:center;border-radius:11px;font-size:19px}.soap-lavender{background:#fce7f3;color:#db2777}.soap-honey{background:#dbeafe;color:#2563eb}.soap-citrus{background:#dcfce7;color:#16a34a}.soap-rose{background:#ffe4e6;color:#be123c}.soap-mint{background:#ccfbf1;color:#0f766e}.popular>div{min-width:0;flex:1}.popular b,.popular small{display:block}.popular b{font-size:10px}.popular small{margin-top:3px;color:#64748b;font-size:8px}.popular i{display:block;height:4px;margin-top:7px;border-radius:8px;background:#f1f5f9}.popular u{display:block;height:100%;border-radius:8px;background:#3b82f6;text-decoration:none}.popular>strong{font-size:10px}.ai-console{margin:0 0 20px;border:1px solid #e3d9f3;border-radius:16px;background:linear-gradient(135deg,#fff,#faf7ff);padding:20px}.ai-console>header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.ai-console>header span,.ai-grid article>span{color:#7c3aed;font-size:8px;font-weight:800;letter-spacing:.14em}.ai-console>header h2{margin-top:5px;font-size:20px;font-weight:800}.ai-console>header p{margin-top:4px;color:#726b7c;font-size:10px}.ai-status{border-radius:20px;background:#ede9fe;padding:7px 10px;color:#6d28d9;font-size:8px}.ai-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}.ai-grid article{display:flex;flex-direction:column;gap:7px;border:1px solid #eeeaf1;border-radius:12px;background:white;padding:13px}.ai-grid article b{font-size:11px}.ai-grid article p{color:#777080;font-size:9px;line-height:1.55}.ai-prompt{display:flex;align-items:center;gap:12px;margin-top:14px;border-radius:13px;background:#3a086b;padding:14px;color:white}.ai-orb{display:grid;width:34px;height:34px;flex:none;place-items:center;border-radius:11px;background:#facc15;color:#4c1d95}.ai-prompt>div:nth-child(2){flex:1}.ai-prompt b{font-size:11px}.ai-prompt p{margin-top:4px;color:#e8dff2;font-size:9px;line-height:1.45}.ai-prompt button{flex:none;border:0;border-radius:8px;background:#facc15;padding:9px 11px;color:#3a086b;font-size:9px;font-weight:800;cursor:pointer}.ai-safety{margin-top:11px;color:#787181;font-size:8px;line-height:1.5}@media(max-width:1050px){.dash-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:800px){.dash-columns{grid-template-columns:1fr}.ai-grid{grid-template-columns:1fr}}@media(max-width:520px){.dash-heading{align-items:flex-start;flex-direction:column}.dash-primary{width:100%}.dash-metrics{gap:9px}.dash-metrics article{min-height:105px;padding:12px}.dash-metrics b{font-size:21px}.dash-card{padding:14px}.ai-prompt{align-items:flex-start;flex-wrap:wrap}.ai-prompt button{margin-left:46px}}
  `],
})
export class DashboardComponent {
  readonly dataService = inject(CrudDataService);
  readonly userName = signal('Rocío Nuñez Kikushima');
  readonly currentSection = signal('Panel de Administración');

  readonly greeting = computed(() => {
    const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  constructor(private readonly router: Router, private readonly route: ActivatedRoute, http: HttpClient) {
    const raw = localStorage.getItem('soapyfun_usuario');
    if (raw) { try { this.userName.set(JSON.parse(raw).nombre || this.userName()); } catch {} }
    const token = localStorage.getItem('soapyfun_token');
    if (token) http.get<{ nombre: string }>(`${environment.apiUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).subscribe({ next: (user) => this.userName.set(user.nombre), error: () => {} });
    this.route.paramMap.subscribe((params) => {
      const last = params.get('section') || 'dashboard';
      const title = last === 'dashboard' ? 'Panel de Administración' : last.split('-').map((w) => w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
      this.currentSection.set(title);
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('soapy-admin-active', { detail: title })), 0);
    });
  }

  calcularBarra(stock: number): number {
    return Math.min(100, Math.round((stock / 30) * 100));
  }

  go(section: string): void {
    if(section === 'Panel de Administración') { void this.router.navigateByUrl('/dashboard'); return; }
    const slug=section.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
    void this.router.navigateByUrl(`/dashboard/${slug}`);
  }

  logout(): void { localStorage.removeItem('soapyfun_token'); localStorage.removeItem('soapyfun_usuario'); void this.router.navigateByUrl('/login'); }
}
