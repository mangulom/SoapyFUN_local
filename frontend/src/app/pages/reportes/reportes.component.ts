import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrudDataService } from '../../core/services/crud-data.service';

@Component({
  selector: 'soapy-reportes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="crud-page">
      <!-- Encabezado de página -->
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span class="text-[9px] font-extrabold uppercase tracking-widest text-purple-700">DECISIONES CON DATOS</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-850 mt-1">Reportes y Rentabilidad</h1>
          <p class="text-xs text-slate-500 mt-1">Análisis integral de ventas, márgenes comerciales por jabón y balance de inventario del taller.</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportarReporteGeneral()" class="btn-primary">
            ↓ Exportar Reporte Consolidado
          </button>
        </div>
      </div>

      <!-- Métricas Clave -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div class="stat-card border-l-4 border-l-purple-600">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventas Acumuladas</span>
          <b class="text-2xl font-black text-purple-900">S/ {{ dataService.totalVentas().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">Pedidos no cancelados</span>
        </div>
        <div class="stat-card border-l-4 border-l-emerald-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margen Medio Catálogo</span>
          <b class="text-2xl font-black text-emerald-600">{{ margenMedio() }}%</b>
          <span class="text-[10px] text-slate-500">Utilidad bruta promedio</span>
        </div>
        <div class="stat-card border-l-4 border-l-amber-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capital en Insumos</span>
          <b class="text-2xl font-black text-amber-600">S/ {{ dataService.valorInventarioInsumos().toFixed(2) }}</b>
          <span class="text-[10px] text-slate-500">Almacén a costo vigente</span>
        </div>
        <div class="stat-card border-l-4 border-l-blue-500">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Insumos Críticos</span>
          <b class="text-2xl font-black text-blue-600">{{ dataService.insumosBajoStock().length }}</b>
          <span class="text-[10px] text-slate-500">Por debajo del mínimo</span>
        </div>
      </div>

      <!-- Tablas de Reportes -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Tabla de Rentabilidad por Producto -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-slate-800">Rentabilidad por Producto</h2>
              <p class="text-xs text-slate-500">Precio de venta vs. costo directo unitario</p>
            </div>
            <span class="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">Margen Bruto</span>
          </div>

          <div class="space-y-4">
            @for (p of dataService.productos(); track p.id) {
              <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="font-bold text-slate-800">{{ p.nombre }}</span>
                  <span class="font-bold text-emerald-600">
                    +S/ {{ (p.precio - p.costo).toFixed(2) }} ({{ calcularMargen(p) }}%)
                  </span>
                </div>
                <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div class="bg-purple-600 h-full rounded-full" [style.width.%]="calcularMargen(p)"></div>
                </div>
                <div class="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Costo: S/ {{ p.costo.toFixed(2) }}</span>
                  <span>Precio: S/ {{ p.precio.toFixed(2) }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Tabla de Salud de Inventario -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-slate-800">Estado de Materias Primas</h2>
              <p class="text-xs text-slate-500">Insumos con reposición requerida</p>
            </div>
            <span class="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">Almacén</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th class="py-2">INSUMO</th>
                  <th class="py-2 text-center">DISPONIBLE</th>
                  <th class="py-2 text-right">VALOR</th>
                  <th class="py-2 text-center">ESTADO</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (ins of dataService.insumos(); track ins.id) {
                  <tr>
                    <td class="py-2.5">
                      <b class="text-slate-800 block">{{ ins.nombre }}</b>
                      <span class="text-[10px] text-slate-400">{{ ins.grupo }}</span>
                    </td>
                    <td class="py-2.5 text-center">
                      <b>{{ ins.stock }}</b> {{ ins.unidad }}
                      <small class="block text-[9px] text-slate-400">Mín: {{ ins.stockMinimo }}</small>
                    </td>
                    <td class="py-2.5 text-right font-mono font-bold text-slate-700">
                      S/ {{ (ins.stock * ins.costoUnitario).toFixed(2) }}
                    </td>
                    <td class="py-2.5 text-center">
                      @if (ins.stock <= ins.stockMinimo) {
                        <span class="pill pill-amber">Reponer</span>
                      } @else {
                        <span class="pill pill-green">Óptimo</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
    .pill { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-amber { background: #fef3c7; color: #b45309; }
  `]
})
export class ReportesComponent {
  readonly dataService = inject(CrudDataService);

  readonly margenMedio = computed(() => {
    const list = this.dataService.productos();
    if (!list.length) return 0;
    const total = list.reduce((sum, p) => sum + ((p.precio - p.costo) / p.precio) * 100, 0);
    return Math.round(total / list.length);
  });

  calcularMargen(p: any): number {
    if (!p.precio || p.precio <= 0) return 0;
    return Math.round(((p.precio - p.costo) / p.precio) * 100);
  }

  exportarReporteGeneral(): void {
    const columnas = ['Tipo', 'Concepto', 'Métrica Principal', 'Detalle'];
    const filas = [
      ['Ventas', 'Total de ventas en pedidos', `S/ ${this.dataService.totalVentas().toFixed(2)}`, `${this.dataService.pedidos().length} pedidos`],
      ['Inventario', 'Valor total de materias primas', `S/ ${this.dataService.valorInventarioInsumos().toFixed(2)}`, `${this.dataService.insumos().length} insumos`],
      ['Catálogo', 'Productos activos en venta', `${this.dataService.productosActivos().length} productos`, `Margen medio: ${this.margenMedio()}%`],
      ['Clientes', 'Comunidad registrada', `${this.dataService.totalClientes()} clientas`, 'Base de datos activa'],
    ];
    this.dataService.exportarCsv('reporte_consolidado_soapyfun', columnas, filas);
  }
}
