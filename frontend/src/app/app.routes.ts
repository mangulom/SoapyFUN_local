import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/productos/productos.component').then((m) => m.ProductosComponent),
      },
      {
        path: 'recetas-y-lotes',
        loadComponent: () => import('./pages/recetas/recetas.component').then((m) => m.RecetasComponent),
      },
      {
        path: 'recetas',
        redirectTo: 'recetas-y-lotes',
        pathMatch: 'full',
      },
      {
        path: 'insumos',
        loadComponent: () => import('./pages/insumos/insumos.component').then((m) => m.InsumosComponent),
      },
      {
        path: 'compras',
        loadComponent: () => import('./pages/compras/compras.component').then((m) => m.ComprasComponent),
      },
      {
        path: 'proveedores',
        loadComponent: () => import('./pages/proveedores/proveedores.component').then((m) => m.ProveedoresComponent),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./pages/pedidos/pedidos.component').then((m) => m.PedidosComponent),
      },
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/clientes.component').then((m) => m.ClientesComponent),
      },
      {
        path: 'facturacion',
        loadComponent: () => import('./pages/facturacion/facturacion.component').then((m) => m.FacturacionComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes/reportes.component').then((m) => m.ReportesComponent),
      },
      {
        path: ':section',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'intro' },
  { path: 'intro', loadComponent: () => import('./app.component').then((m) => m.App) },
  { path: '**', redirectTo: 'login' },
];
