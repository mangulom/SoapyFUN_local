import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent) },
  { path: 'dashboard', component: AdminLayoutComponent, canActivate: [authGuard], children: [
    { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
    { path: ':section', loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
  ] },
  { path: '', pathMatch: 'full', redirectTo: 'intro' },
  { path: 'intro', loadComponent: () => import('./app.component').then((m) => m.App) },
  { path: '**', redirectTo: 'login' },
];
