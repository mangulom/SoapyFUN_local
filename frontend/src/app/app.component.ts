import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { IntroComponent } from './intro.component';

type Section = 'Inicio' | 'Panel de Administraci\u00f3n' | 'Productos' | 'Recetas y lotes' | 'Insumos' | 'Compras' | 'Proveedores' | 'Pedidos' | 'Clientes' | 'Facturaci\u00f3n' | 'Reportes' | 'Empresas' | 'Asistente SoapyFUN AI' | 'Pron\u00f3stico de demanda' | 'Recomendador de precios' | 'An\u00e1lisis de rentabilidad' | 'Alertas inteligentes' | 'Copiloto de formulaci\u00f3n' | 'Lectura de facturas' | 'Centro de modelos y datos';

@Component({
  selector: 'soapy-root',
  standalone: true,
  imports: [RouterOutlet, IntroComponent],
  template: `
    @if (showIntro()) {
      <soapy-intro></soapy-intro>
    } @else {
      <router-outlet />
    }
  `,
})
export class App {
  readonly showIntro = signal(true);
  readonly dashboardMode = signal(false);

  constructor(private readonly router: Router, private readonly route: ActivatedRoute) {}

  selectSection(section: string): void {
    const key = section.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    const path: Record<string, string> = { 'panel-de-administracion': '/dashboard', productos: '/dashboard/productos', 'recetas-y-lotes': '/dashboard/recetas-y-lotes', recetas: '/dashboard/recetas-y-lotes', insumos: '/dashboard/insumos', compras: '/dashboard/compras', proveedores: '/dashboard/proveedores', pedidos: '/dashboard/pedidos', clientes: '/dashboard/clientes', facturacion: '/dashboard/facturacion', reportes: '/dashboard/reportes', empresas: '/dashboard/empresas', 'asistente-soapyfun-ai': '/dashboard/asistente-soapyfun-ai', 'pronostico-de-demanda': '/dashboard/pronostico-de-demanda', 'recomendador-de-precios': '/dashboard/recomendador-de-precios', 'analisis-de-rentabilidad': '/dashboard/analisis-de-rentabilidad', 'alertas-inteligentes': '/dashboard/alertas-inteligentes', 'copiloto-de-formulacion': '/dashboard/copiloto-de-formulacion', 'lectura-de-facturas': '/dashboard/lectura-de-facturas', 'centro-de-modelos-y-datos': '/dashboard/centro-de-modelos-y-datos' };
    const target = path[key]; if (target) void this.router.navigateByUrl(target);
  }

  navIconPath(item: Section): string {
    return ({
      Inicio: 'M3 10.8 12 3l9 7.8v9.1a1.1 1.1 0 0 1-1.1 1.1h-5.2v-6.2H9.3V21H4.1A1.1 1.1 0 0 1 3 19.9z',
      Productos: 'M4 5.5 12 2l8 3.5v13L12 22l-8-3.5zm0 0 8 3.7 8-3.7M12 9.2V22',
      Recetas: 'M6 3h12a2 2 0 0 1 2 2v15H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v14a3 3 0 0 0 3 3m1-12h6m-6 4h6',
      Insumos: 'M4 7h16v14H4zM7 7V4h10v3m-7 4h4m-2-2v4m-7 3h14',
      Compras: 'M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.5L21 8H6m4 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
      Proveedores: 'M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6m-6-9h.01M15 11h.01',
      Pedidos: 'M5 4h14v17H5zM8 8h8m-8 4h8m-8 4h5m7-12 2 2',
      Clientes: 'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20m6-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.7m1 3h.5a4.5 4.5 0 0 1 4.5 4.5V20',
      'Facturación': 'M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v5h5m-9 4h5m-5 4h5m-5 4h3',
      Reportes: 'M4 20V11h4v9m2 0V4h4v16m2 0v-7h4v7M3 20h18',
      'Panel de Administraci\u00f3n': 'M3 10.8 12 3l9 7.8v9.1a1.1 1.1 0 0 1-1.1 1.1h-5.2v-6.2H9.3V21H4.1A1.1 1.1 0 0 1 3 19.9z',
      'Recetas y lotes': 'M6 3h12a2 2 0 0 1 2 2v15H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v14a3 3 0 0 0 3 3m1-12h6m-6 4h6',
      Empresas: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01',
      'Asistente SoapyFUN AI': 'M12 3v3m0 12v3M3 12h3m12 0h3M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z',
      'Pron\u00f3stico de demanda': 'M3 18V6m0 12h18M7 15l4-5 3 3 6-7',
      'Recomendador de precios': 'M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      'An\u00e1lisis de rentabilidad': 'M4 19V5m0 14h17M8 16v-4m5 4V8m5 8v-7',
      'Alertas inteligentes': 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4',
      'Copiloto de formulaci\u00f3n': 'M9 3h6m-5 0v6L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3',
      'Lectura de facturas': 'M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v5h5m-9 4h5m-5 4h5',
      'Centro de modelos y datos': 'M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5',
    } as Record<Section, string>)[item];
  }

  ngOnInit(): void {
    // Intro de 3 s y pausa de 3 s antes del login.
    if (typeof window === 'undefined' || this.route.snapshot.data['dashboard']) { this.showIntro.set(false); return; }
    window.setTimeout(() => {
      this.showIntro.set(false);
      if (this.route.snapshot.data['dashboard']) return;
      window.setTimeout(() => void this.router.navigateByUrl('/login'), 3000);
    }, 3000);
  }
}
