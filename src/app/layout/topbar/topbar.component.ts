import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, lastValueFrom, Subscription } from 'rxjs';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../services/auth.service';
import { bffApiUrl } from '../../auth-config';

interface TopbarNotification {
  id: string;
  title: string;
  description: string;
  icon: string;
  tone: 'warning' | 'danger' | 'info';
  route: string;
  read: boolean;
}

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {
  title = 'Panel general';
  crumb = 'Inicio';
  searchTerm = '';
  notifications: TopbarNotification[] = [];
  notificationsOpen = false;
  loadingNotifications = false;
  notificationError: string | null = null;
  private subscriptions = new Subscription();
  private readonly readKey = 'gesfun.notifications.read';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public layout: LayoutService,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.updateMetadata();
    this.loadNotifications();
    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.updateMetadata())
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private updateMetadata() {
    let activeRoute = this.route.root;
    while (activeRoute.firstChild) {
      activeRoute = activeRoute.firstChild;
    }
    const data = activeRoute.snapshot.data;
    this.title = data['title'] || 'Panel general';
    this.crumb = data['crumb'] || 'Inicio';
  }

  goNew() {
    this.router.navigate(['/cotizacion']);
  }

  goSearch() {
    const q = this.searchTerm.trim();
    if (!q) return;

    this.router.navigate(['/cotizaciones'], {
      queryParams: { q }
    });
  }

  get unreadNotifications() {
    return this.notifications.filter(item => !item.read).length;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) {
      this.loadNotifications();
    }
  }

  closeNotifications() {
    this.notificationsOpen = false;
  }

  openNotification(item: TopbarNotification) {
    this.markAsRead(item);
    this.notificationsOpen = false;
    this.router.navigate([item.route]);
  }

  markAllAsRead() {
    const ids = new Set([...this.getReadNotificationIds(), ...this.notifications.map(item => item.id)]);
    localStorage.setItem(this.readKey, JSON.stringify([...ids]));
    this.notifications = this.notifications.map(item => ({ ...item, read: true }));
  }

  private markAsRead(item: TopbarNotification) {
    const ids = new Set([...this.getReadNotificationIds(), item.id]);
    localStorage.setItem(this.readKey, JSON.stringify([...ids]));
    this.notifications = this.notifications.map(notification =>
      notification.id === item.id ? { ...notification, read: true } : notification
    );
  }

  private async loadNotifications() {
    if (!this.auth.isAuthenticated()) return;

    this.loadingNotifications = true;
    this.notificationError = null;
    try {
      const token = await this.auth.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [cotizaciones, pagos, documentos] = await Promise.all([
        this.getList(`${bffApiUrl}/api/cotizaciones`, headers),
        this.getList(`${bffApiUrl}/api/pagos`, headers),
        this.getList(`${bffApiUrl}/api/documentos-tributarios`, headers)
      ]);
      this.notifications = this.buildNotifications(cotizaciones, pagos, documentos);
    } catch {
      this.notificationError = 'No se pudieron cargar las notificaciones.';
      this.notifications = [];
    } finally {
      this.loadingNotifications = false;
    }
  }

  private buildNotifications(cotizaciones: any[], pagos: any[], documentos: any[]): TopbarNotification[] {
    const readIds = new Set(this.getReadNotificationIds());
    const pagosRegistrados = pagos.filter(item => this.value(item.estado) !== 'ANULADO');
    const documentosActivos = documentos.filter(item => this.value(item.estado) !== 'ANULADO');
    const pagadas = new Set(pagosRegistrados.map(item => this.value(item.cotizacionUuid ?? item.cotizacion_uuid)));
    const documentadas = new Set(documentosActivos.map(item => this.value(item.pagoUuid ?? item.pago_uuid)));

    const pendientesPago = cotizaciones
      .filter(item => this.cotizacionRequierePago(item, pagadas))
      .slice(0, 3)
      .map(item => this.createNotification(
        `cotizacion-pago-${this.value(item.uuid)}`,
        'Cotizacion sin pago',
        `Cotizacion ${this.value(item.numero ?? item.folio ?? item.codigo)} pendiente de pago.`,
        'bi-cash-coin',
        'warning',
        '/facturacion',
        readIds
      ));

    const pagosSinDte = pagosRegistrados
      .filter(item => !documentadas.has(this.value(item.uuid)))
      .slice(0, 3)
      .map(item => this.createNotification(
        `pago-dte-${this.value(item.uuid)}`,
        'Pago sin DTE',
        `Pago de cotizacion ${this.value(item.cotizacionNumero ?? item.cotizacion_numero)} pendiente de documentar.`,
        'bi-receipt',
        'warning',
        '/facturacion',
        readIds
      ));

    const dteObservados = documentosActivos
      .filter(item => ['PENDIENTE', 'RECHAZADO'].includes(this.value(item.estado)))
      .slice(0, 3)
      .map(item => {
        const estado = this.value(item.estado);
        return this.createNotification(
          `dte-${estado.toLocaleLowerCase('es-CL')}-${this.value(item.uuid)}`,
          estado === 'RECHAZADO' ? 'DTE rechazado' : 'DTE pendiente',
          `${this.value(item.tipoDocumentoNombre ?? item.tipo_documento_nombre ?? item.tipoDocumentoCodigo)} ${this.value(item.folio) || 'sin folio'} requiere revision.`,
          estado === 'RECHAZADO' ? 'bi-exclamation-octagon' : 'bi-hourglass-split',
          estado === 'RECHAZADO' ? 'danger' : 'info',
          '/facturacion',
          readIds
        );
      });

    return [...dteObservados, ...pagosSinDte, ...pendientesPago].slice(0, 8);
  }

  private createNotification(
    id: string,
    title: string,
    description: string,
    icon: string,
    tone: TopbarNotification['tone'],
    route: string,
    readIds: Set<string>
  ): TopbarNotification {
    return { id, title, description, icon, tone, route, read: readIds.has(id) };
  }

  private cotizacionRequierePago(item: any, pagadas: Set<string>) {
    const uuid = this.value(item.uuid);
    const estado = this.value(item.estadoCodigo ?? item.estado ?? item.estadoNombre ?? item.estado_nombre);
    if (!uuid || pagadas.has(uuid)) return false;
    return ['ACEPTADA', 'APROBADA', 'VIGENTE', 'EMITIDA'].includes(estado);
  }

  private async getList(url: string, headers: { Authorization: string }) {
    const response = await lastValueFrom(this.http.get<any>(url, { headers }));
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? payload?.items ?? [];
  }

  private getReadNotificationIds(): string[] {
    try {
      const value = JSON.parse(localStorage.getItem(this.readKey) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  private value(value: any) {
    return String(value ?? '').trim().toLocaleUpperCase('es-CL');
  }
}
