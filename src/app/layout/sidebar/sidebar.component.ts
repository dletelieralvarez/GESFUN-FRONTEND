import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { filter, Subscription } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { NAV_BS } from '../../data/ui-data';
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';

interface SidebarNavItem {
  id: string;
  label: string;
  icon: string;
  count?: number | null;
}

interface SidebarNavGroup {
  group: string;
  items: SidebarNavItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  nav: SidebarNavGroup[] = NAV_BS.map(group => ({
    ...group,
    items: group.items.map(item => ({ ...item }))
  }));
  currentView = 'dashboard';
  loggingOut = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private auth: AuthService,
    private layout: LayoutService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.setCurrentView(this.router.url);
    this.loadServiciosCount();
    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
        const navEvent = event as NavigationEnd;
        this.setCurrentView(navEvent.urlAfterRedirects);
        this.layout.closeSidebar();
        this.loadServiciosCount();
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private setCurrentView(url: string) {
    this.currentView = url.replace(/^\//, '') || 'dashboard';
  }

  private async loadServiciosCount() {
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/servicios`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      const servicios = this.extractPayload<any>(response);
      this.setNavCount('casos', servicios.filter(item => this.isServicioActivo(item)).length);
    } catch {
      this.setNavCount('casos', null);
    }
  }

  private setNavCount(id: string, count: number | null) {
    this.nav = this.nav.map(group => ({
      ...group,
      items: group.items.map(item => item.id === id ? { ...item, count } : item)
    }));
  }

  private isServicioActivo(item: any) {
    const activo = item.activo === undefined
      || item.activo === null
      || item.activo === true
      || item.activo === 1
      || item.activo === '1'
      || String(item.activo).toLocaleLowerCase('es-CL') === 'true';
    const estado = String(item.estado ?? item.estadoCodigo ?? item.estado_codigo ?? '').toLocaleUpperCase('es-CL');
    return activo && !['COMPLETADO', 'ANULADO'].includes(estado);
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? payload?.items ?? [];
  }

  get userName() {
    const account = this.auth.getActiveAccount();
    return account?.name || account?.username || 'Usuario';
  }

  get userEmail() {
    return this.auth.getActiveAccount()?.username || 'Sesion activa';
  }

  async logout() {
    if (this.loggingOut) {
      return;
    }

    this.loggingOut = true;
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('No se pudo cerrar sesion', error);
      this.loggingOut = false;
    }
  }
}
