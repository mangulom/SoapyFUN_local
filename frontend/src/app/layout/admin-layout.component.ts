import { Component, HostListener, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastComponent } from '../shared/components/toast/toast.component';

type MenuItem = { name: string; icon: string; admin?: boolean };
type MenuGroup = { title: string; items: MenuItem[] };

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `
    <div class="admin-shell min-h-screen bg-slate-100">
      <soapy-toast></soapy-toast>

      <aside class="admin-sidebar" [class.sidebar-collapsed]="collapsed()" [class.sidebar-open]="mobileOpen()">
        <div class="sidebar-brand"><img class="brand-mark" src="/icon.svg" alt="SoapyFUN" />@if (!collapsed()) {<div><b>Soapy<span>FUN</span></b><small>GESTI&Oacute;N DE PRODUCTOS ARTESANALES</small></div>}<button class="mobile-close" (click)="mobileOpen.set(false)" aria-label="Cerrar men&uacute;">&times;</button></div>
        <nav class="sidebar-nav">@for (group of menu; track group.title) {<section class="menu-group"><h2>{{group.title}}</h2>@for(item of group.items;track item.name){@if(!item.admin || isAdmin()){<button class="menu-item" [class.menu-active]="activeSection()===item.name" (click)="navigate(item.name)" [title]="collapsed()?item.name:''"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="item.icon"/></svg>@if(!collapsed()){<span>{{item.name}}</span>}</button>}}</section>}</nav>
        <div class="sidebar-bottom"><div class="user-avatar">RN</div>@if(!collapsed()){<div class="user-caption"><b>{{userName}}</b><small>{{userRole}}</small></div>}<button class="collapse-button" (click)="collapsed.set(!collapsed())" aria-label="Colapsar men&uacute;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m14 18-6-6 6-6"/></svg></button></div>
      </aside>

      @if(mobileOpen()){<button class="sidebar-scrim" (click)="mobileOpen.set(false)" aria-label="Cerrar menú"></button>}

      <div class="admin-main" [class.main-collapsed]="collapsed()">
        <!-- HEADER CORREGIDO: Fondo de lado a lado, contenido empujado a la derecha -->
        <header class="admin-header">
          <button class="mobile-menu" (click)="mobileOpen.set(true)" aria-label="Abrir menú"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
          <div class="top-brand mobile-brand"><img class="brand-mark top-mark" src="/icon.svg" alt="SoapyFUN" /><b>Soapy<span>FUN</span></b></div>
          <div class="header-date">{{today}}</div>
          <div class="header-spacer"></div>
          <span class="workspace-dot"></span>
          <button class="workspace-name">{{companyName}} <span>&darr;</span></button>
          <span class="active-badge">ACTIVA</span>
          <button class="help-button" (click)="navigate('Reportes')" aria-label="Ayuda">?</button>
          <button (click)="logout()" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-900/40 text-purple-200 hover:text-white hover:bg-purple-900/80 transition" title="Cerrar sesi&oacute;n">Salir</button>
          <div class="header-account"><div class="header-user">{{userName.slice(0,1)}}</div><span><b>{{userName}}</b><small>{{userRole}}</small></span></div>
        </header>

        <main class="admin-content"><router-outlet></router-outlet></main>

        <footer class="admin-footer"><span class="footer-left"><img class="footer-brand" src="/icon.svg" alt="" /><b>Soapy<span>FUN</span></b> <span>Gesti&oacute;n artesanal con IA</span> <strong>v1.0.0</strong> <span>&middot; PostgreSQL 17 &middot; FastAPI &middot; Angular 19</span></span><span class="footer-credit">Powered by Mauricio Antonio Angulo Martinez &middot; ROC&Iacute;O ZARELA N&Uacute;&Ntilde;EZ KIKUSHIMA &middot; &copy; 2026</span></footer>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .admin-shell { --deep:#2e1554; --purple:#6d35c4; --accent:#facc15; --muted:#8b8494; height:100vh; min-height:100vh; overflow:hidden; color:#282333; font-family:Roboto,Inter,system-ui,sans-serif; }

    /* SIDEBAR */
    .admin-sidebar { position: fixed; top: 0; bottom: 0; left: 0; z-index: 40; display: flex; width: 221px; flex-direction: column; background: #3a086b; color: #e9def9; transition: width .25s, transform .25s; box-shadow: 5px 0 24px #28174312; }
    .admin-sidebar.sidebar-collapsed { width: 64px; }
    .sidebar-brand { display: flex; align-items: center; gap: 12px; min-height: 76px; padding: 14px 18px; border-bottom: 1px solid #ffffff18; }
    .brand-mark { display: block; width: 40px; height: 40px; flex: none; border-radius: 13px; object-fit: cover; }
    .sidebar-brand b { display: block; color: white; font-size: 16px; }
    .sidebar-brand b span, .top-brand b span, .admin-footer b span { color: #facc15; }
    .sidebar-brand small { display: block; margin-top: 4px; color: #c4b5d7; font-size: 8px; letter-spacing: .14em; }
    .mobile-close { display: none; margin-left: auto; background: none; color: white; font-size: 24px; }
    .sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* Evita scroll horizontal */
  padding: 14px 8px;
  /* Personalización de la barra de scroll para que sea delgada */
  scrollbar-width: thin;
  scrollbar-color: #6d35c4 transparent;
}
    .menu-group { margin-bottom: 19px; }
    .menu-group h2 { padding: 0 10px; margin: 0 0 7px; color: #c9a7eb; font-size: 8px; letter-spacing: .12em; }
    .menu-item { display: flex; width: 100%; align-items: center; gap: 12px; margin: 2px 0; border: 0; border-radius: 9px; background: transparent; padding: 9px 10px; color: #e6d9f4; text-align: left; font-size: 12px; cursor: pointer; transition: .16s; }
    .menu-item svg { width: 19px; height: 19px; flex: none; }
    .menu-item:hover { background: #ffffff12; color: white; }
    .menu-item.menu-active { background: #facc15; color: #35165c; font-weight: 700; }
    .sidebar-collapsed .sidebar-brand { justify-content: center; padding: 12px 8px; }
    .sidebar-collapsed .sidebar-nav { padding-inline: 8px; }
    .sidebar-collapsed .menu-group h2 { height: 4px; overflow: hidden; color: transparent; }
    .sidebar-collapsed .menu-item { justify-content: center; padding: 11px 7px; }
    .sidebar-bottom { display: flex; align-items: center; gap: 10px; min-height: 60px; padding: 10px 12px; border-top: 1px solid #ffffff18; }
    .user-avatar, .header-user { display: grid; width: 32px; height: 32px; flex: none; place-items: center; border-radius: 50%; background: #facc15; color: #3a086b; font-size: 10px; font-weight: 800; }
    .user-caption { min-width: 0; flex: 1; }
    .user-caption b, .user-caption small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-caption b { font-size: 9px; color: white; }
    .user-caption small { margin-top: 3px; font-size: 8px; color: #e9c74e; }
    .collapse-button { display: grid; width: 28px; height: 28px; place-items: center; border: 0; border-radius: 7px; background: #ffffff12; color: white; cursor: pointer; }
    .collapse-button svg { width: 16px; height: 16px; }
    .sidebar-collapsed .collapse-button { transform: rotate(180deg); }

    /* LAYOUT PRINCIPAL */
    .admin-main { display: flex; height: 100vh; min-height: 100vh; flex-direction: column; padding-left: 221px; transition: padding .25s; }
    .admin-main.main-collapsed { padding-left: 64px; }

    /* HEADER CORREGIDO */
.admin-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 45;
  display: flex;
  height: 70px;
  flex: none;
  align-items: center;
  gap: 16px;
  background: #3a086b;
  color: white;
  padding: 0 16px; /* <-- Aquí estaba el problema: tenías un padding-left dinámico. Debe ser 0 16px */
}
    /* En pantallas grandes, empujamos el contenido del header (pero no el fondo) para que no se tape con el sidebar */
    @media(min-width: 801px) {
      .admin-header { padding-left: 221px; transition: padding .25s; }
      .admin-main.main-collapsed .admin-header { padding-left: 64px; }
    }

.top-brand {
  display: flex;
  width: 221px; /* <-- Forzamos a que mida lo mismo que el sidebar */
  flex: none;
  align-items: center;
  gap: 10px;
}
    .top-brand b { font-size: 15px; }
    @media(min-width:801px){ .admin-header .top-brand { display:none; } .admin-header { left:221px; } .admin-main.main-collapsed .admin-header { left:64px; } }
    .top-mark { width: 36px; height: 36px; border-radius: 10px; background: transparent; }
    .header-date { font-size: 11px; color: #eee1fa; }
    .header-spacer { flex: 1; }
    .workspace-dot { width: 10px; height: 10px; border-radius: 50%; background: #8b5cf6; }
    .workspace-name { border: 1px solid #74449b; border-radius: 9px; background: #531b7c; padding: 9px 12px; color: white; font-size: 11px; font-weight: 700; }
    .workspace-name span { margin-left: 13px; color: #facc15; }
    .active-badge { border-radius: 20px; background: #7935ca; padding: 5px 8px; color: #f4eaff; font-size: 8px; font-weight: 800; }
    .help-button { width: 32px; height: 32px; border: 0; border-radius: 50%; background: #512079; color: #facc15; font-weight: 800; cursor: pointer; }
    .admin-header .header-icon { border: 0; background: transparent; color: white; }
    .header-icon em { position: absolute; top: -5px; right: -4px; display: grid; width: 17px; height: 17px; place-items: center; border-radius: 50%; background: #facc15; color: #36135a; font-size: 9px; font-style: normal; font-weight: 800; }
    .header-account { display: flex; align-items: center; gap: 8px; }
    .header-account b, .header-account small { display: block; white-space: nowrap; }
    .header-account b { font-size: 10px; color: white; }
    .header-account small { margin-top: 2px; color: #facc15; font-size: 8px; }

    /* CONTENIDO Y FOOTER */
    .admin-content { width: 100%; flex: 1; overflow-y: auto; margin: 0; padding: 86px 24px 30px; background: #f8fafc; }
    .admin-footer { position: fixed; inset: auto 0 0 0; z-index: 46; display: flex; min-height: 48px; align-items: center; justify-content: space-between; gap: 12px; background: #3a086b; padding: 4px 16px; color: #f8eaff; font-size: 9px; }
    .admin-footer > span { display: flex; align-items: center; gap: 7px; } .footer-left { flex-wrap: wrap; } .footer-credit { justify-content: flex-end; text-align: right; white-space: normal; }
    .footer-brand { display: block; width: 24px; height: 24px; flex: none; border-radius: 7px; object-fit: cover; }
    .admin-footer b { color: white; }
    .admin-footer strong { color: #facc15; font-size: 10px; }
    .mobile-menu { display: none; border: 0; background: none; }
    .sidebar-scrim { display: none; }

    /* RESPONSIVE (MÓVILES) */
    @media(max-width: 800px) {
      .admin-sidebar, .admin-sidebar.sidebar-collapsed { inset: 0 auto 0 0; width: 256px; transform: translateX(-100%); }
      .admin-sidebar.sidebar-open { transform: translateX(0); }
      .mobile-close { display: block; }
      .sidebar-collapsed .sidebar-brand { justify-content: flex-start; padding: 14px 18px; }
      .sidebar-collapsed .menu-item { justify-content: flex-start; padding: 10px; }
      .admin-main, .admin-main.main-collapsed { height: 100dvh; min-height: 0; padding-left: 0; }
      .mobile-menu { display: grid; width: 30px; height: 30px; place-items: center; border: 0; background: transparent; color: white; }
      .mobile-menu svg { width: 20px; height: 20px; }
      .sidebar-scrim { position: fixed; inset: 0; z-index: 35; display: block; border: 0; background: #1e143b88; }
      .admin-header { gap: 10px; padding: 0 12px; left:0; }
      .admin-header .top-brand { display:flex; }
      .top-brand { width: auto; min-width: 100px; }
      .top-brand b { font-size: 13px; }
      .header-date, .workspace-dot, .workspace-name, .active-badge, .help-button { display: none; }
      .header-spacer { flex: 1; }
      .header-account b { display: none; }
      .header-account small { display: none; }
      .admin-content { padding: 86px 12px 60px; }
      .admin-footer { padding: 0 9px; }
      .admin-footer > span:last-child { font-size: 8px; white-space: normal; }
    }
  `]
})
export class AdminLayoutComponent {
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly activeSection = signal('Panel de Administración');
  readonly companyName = this.readUser()['company_name'] || 'KIKURELA';
  readonly userName = this.readUser()['nombre'] || 'Usuario';
  readonly userRole = this.readUser()['rol'] || 'Usuario';
  readonly today = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  readonly menu: MenuGroup[] = [
    {
      title: 'GENERAL', items: [
        { name: 'Panel de Administración', icon: 'M3 10.8 12 3l9 7.8v9.1a1.1 1.1 0 0 1-1.1 1.1h-5.2v-6.2H9.3V21H4.1A1.1 1.1 0 0 1 3 19.9z' },
        { name: 'Productos', icon: 'M4 5.5 12 2l8 3.5v13L12 22l-8-3.5zm0 0 8 3.7 8-3.7M12 9.2V22' },
        { name: 'Recetas y lotes', icon: 'M6 3h12a2 2 0 0 1 2 2v15H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v14a3 3 0 0 0 3 3m1-12h6m-6 4h6' },
      ]
    },
    {
      title: 'ABASTECIMIENTO', items: [
        { name: 'Insumos', icon: 'M4 7h16v14H4zM7 7V4h10v3m-7 4h4m-2-2v4m-7 3h14' },
        { name: 'Compras', icon: 'M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.5L21 8H6m4 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z' },
        { name: 'Proveedores', icon: 'M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6m-6-9h.01M15 11h.01' },
      ]
    },
    {
      title: 'VENTAS', items: [
        { name: 'Pedidos', icon: 'M5 4h14v17H5zM8 8h8m-8 4h8m-8 4h5m7-12 2 2' },
        { name: 'Clientes', icon: 'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20m6-9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.7m1 3h.5a4.5 4.5 0 0 1 4.5 4.5V20' },
        { name: 'Facturación', icon: 'M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v5h5m-9 4h5m-5 4h5m-5 4h3' },
      ]
    },
    {
      title: 'INTELIGENCIA ARTIFICIAL', items: [
        { name: 'Asistente SoapyFUN AI', admin: true, icon: 'M12 3v3m0 12v3M3 12h3m12 0h3M8 12a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z' },
        { name: 'Pron?stico de demanda', admin: true, icon: 'M3 18V6m0 12h18M7 15l4-5 3 3 6-7' },
        { name: 'Recomendador de precios', admin: true, icon: 'M12 2v20m5-15H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
        { name: 'An?lisis de rentabilidad', admin: true, icon: 'M4 19V5m0 14h17M8 16v-4m5 4V8m5 8v-7' },
        { name: 'Alertas inteligentes', admin: true, icon: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4' },
        { name: 'Copiloto de formulaci?n', admin: true, icon: 'M9 3h6m-5 0v6L5 18a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3' },
        { name: 'Lectura de facturas', admin: true, icon: 'M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v5h5m-9 4h5' },
        { name: 'Centro de modelos y datos', admin: true, icon: 'M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5m-18 5 9 5 9-5' },
      ]
    },
    { title: 'ANÁLISIS', items: [{ name: 'Reportes', icon: 'M4 20V11h4v9m2 0V4h4v16m2 0v-7h4v7M3 20h18' }] },
    { title: 'ADMINISTRACIÓN', items: [{ name: 'Empresas', admin: true, icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01' }, { name: 'Usuarios', admin: true, icon: 'M16 18h6v-1a4 4 0 0 0-6.5-3.1M16 18H8m8 0v-1a4 4 0 0 0-8 0v1m8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM8 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z' }] },
  ];

  private readUser(): Record<string, any> { try { return JSON.parse(typeof localStorage !== 'undefined' ? localStorage.getItem('soapyfun_usuario') || '{}' : '{}'); } catch { return {}; } }

  isAdmin(): boolean { try { const role = JSON.parse(typeof localStorage !== 'undefined' ? localStorage.getItem('soapyfun_usuario') || '{}' : '{}').rol; return (typeof role === 'string' ? role : role?.nombre || '').toLowerCase().includes('admin'); } catch { return false; } }

  navigate(name: string): void {
    this.activeSection.set(name);
    this.mobileOpen.set(false);
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
    void this.router.navigateByUrl(name === 'Panel de Administración' ? '/dashboard' : `/dashboard/${slug}`);
  }

  private sincronizarRutaConMenu(url: string): void {
    const segmento = url.split('/dashboard/')[1]?.split('?')[0]?.split('#')[0] || '';
    if (!segmento) {
      this.activeSection.set('Panel de Administración');
      return;
    }
    for (const g of this.menu) {
      for (const item of g.items) {
        const itemSlug = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
        if (itemSlug === segmento) {
          this.activeSection.set(item.name);
          return;
        }
      }
    }
  }

  @HostListener('window:soapy-section-change', ['$event']) onSection(event: Event): void { const section = (event as CustomEvent<string>).detail; if (section) this.navigate(section); }
  @HostListener('window:soapy-admin-active', ['$event']) onActive(event: Event): void { this.activeSection.set((event as CustomEvent<string>).detail || 'Panel de Administración'); }
  @HostListener('window:keydown.escape') closeOnEscape(): void { this.mobileOpen.set(false); }
  logout(): void { localStorage.removeItem('soapyfun_token'); localStorage.removeItem('soapyfun_usuario'); void this.router.navigateByUrl('/login'); }

  constructor(private readonly router: Router) {
    this.sincronizarRutaConMenu(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.sincronizarRutaConMenu(event.urlAfterRedirects);
      }
    });
  }
}