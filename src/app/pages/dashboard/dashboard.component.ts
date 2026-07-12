import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { CLP } from '../../data/ui-data';
import { AuthService } from '../../services/auth.service';
import { ErrorMessageService } from '../../services/error-message.service';

interface CatalogoItem {
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

interface DashboardCotizacion {
  uuid: string;
  numero: string;
  fecha: string;
  cliente: string;
  fallecido: string;
  plan: string;
  estado: string;
  estadoCodigo: string;
  total: number;
  sucursalUuid: string;
}

interface DashboardAgenda {
  uuid: string;
  recurso: string;
  titulo: string;
  observacion: string;
  estado: string;
  inicio: Date | null;
  fin: Date | null;
}

interface StockResumen {
  productoUuid: string;
  codigo: string;
  nombre: string;
  unidad: string;
  stockActual: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  sucursales: CatalogoItem[] = [];
  selectedSucursalUuid = '';
  cotizaciones: DashboardCotizacion[] = [];
  agenda: DashboardAgenda[] = [];
  stock: StockResumen[] = [];
  loading = false;
  error: string | null = null;
  warning: string | null = null;
  today = this.toDateInput(new Date());
  clp = CLP;
  math = Math;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadDashboard();
  }

  get selectedSucursal() {
    return this.sucursales.find(item => item.uuid === this.selectedSucursalUuid);
  }

  get userName() {
    return this.auth.getActiveAccount()?.name?.split(' ')[0] || 'Usuario';
  }

  get headerTitle() {
    return `Buenos días, ${this.userName}`;
  }

  get headerSub() {
    const sucursal = this.selectedSucursal?.nombre || 'sin sucursal seleccionada';
    return `${this.formatDateLong(this.today)} · Resumen operativo de ${sucursal}`;
  }

  get cotizacionesSucursal() {
    if (!this.selectedSucursalUuid) return this.cotizaciones;
    return this.cotizaciones.filter(item => !item.sucursalUuid || item.sucursalUuid === this.selectedSucursalUuid);
  }

  get cotizacionesActivas() {
    return this.cotizacionesSucursal.filter(item => !this.isFinalEstado(item.estadoCodigo));
  }

  get cotizacionesPendientes() {
    return this.cotizacionesSucursal.filter(item => {
      const value = `${item.estado} ${item.estadoCodigo}`.toLocaleLowerCase('es-CL');
      return value.includes('borrador') || value.includes('pend') || value.includes('revision') || value.includes('revisión');
    }).length;
  }

  get agendaHoy() {
    return this.agenda
      .filter(item => this.overlapsDate(item, this.today))
      .sort((a, b) => this.timeValue(a.inicio) - this.timeValue(b.inicio));
  }

  get eventosHoy() {
    return this.agendaHoy.length;
  }

  get recursosOcupadosHoy() {
    return new Set(this.agendaHoy
      .filter(item => item.estado.toLocaleUpperCase('es-CL') === 'OCUPADO')
      .map(item => item.recurso)
    ).size;
  }

  get ingresosMes() {
    const currentMonth = this.today.slice(0, 7);
    return this.cotizacionesSucursal
      .filter(item => item.fecha?.slice(0, 7) === currentMonth && !this.isCancelledEstado(item.estadoCodigo))
      .reduce((sum, item) => sum + item.total, 0);
  }

  get stockCritico() {
    return this.stock
      .filter(item => item.stockActual <= 0)
      .sort((a, b) => a.stockActual - b.stockActual);
  }

  get stockBajo() {
    return this.stock
      .filter(item => item.stockActual > 0 && item.stockActual <= 5)
      .sort((a, b) => a.stockActual - b.stockActual);
  }

  get alertasStock() {
    return [...this.stockCritico, ...this.stockBajo];
  }

  get cotizacionesRecientes() {
    return [...this.cotizacionesSucursal]
      .sort((a, b) => this.sortDate(b.fecha) - this.sortDate(a.fecha))
      .slice(0, 6);
  }

  async onSucursalChange() {
    await this.loadSucursalData();
  }

  agendaBadge(item: DashboardAgenda) {
    return item.estado.toLocaleUpperCase('es-CL') === 'OCUPADO' ? 'b-ok' : 'b-neutral';
  }

  badgeEstado(item: DashboardCotizacion) {
    const value = `${item.estado} ${item.estadoCodigo}`.toLocaleLowerCase('es-CL');
    if (value.includes('contr') || value.includes('acept') || value.includes('aprob')) return 'b-ok';
    if (value.includes('venc') || value.includes('anul') || value.includes('rechaz')) return 'b-danger';
    if (value.includes('pend') || value.includes('borrador')) return 'b-warn';
    return 'b-info';
  }

  formatAgendaRange(item: DashboardAgenda) {
    const start = item.inicio ? this.formatDateTime(item.inicio) : 'Inicio no informado';
    const end = item.fin ? this.formatDateTime(item.fin) : 'Fin no informado';
    return `${start} - ${end}`;
  }

  formatFecha(value: string) {
    if (!value) return 'No informada';
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-CL');
  }

  private async loadDashboard() {
    this.loading = true;
    this.error = null;
    this.warning = null;
    try {
      const token = await this.auth.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [sucursales, cotizaciones] = await Promise.all([
        this.getCatalogo(`${bffApiUrl}/api/sucursales`, headers, true, 'sucursales'),
        this.getCatalogo(`${bffApiUrl}/api/cotizaciones`, headers, false, 'cotizaciones')
      ]);

      this.sucursales = sucursales.map(item => this.fromCatalogo(item)).filter(item => item.activo);
      this.cotizaciones = cotizaciones.map((item, index) => this.fromCotizacion(item, index));
      this.selectedSucursalUuid = this.sucursales[0]?.uuid || '';
      await this.loadSucursalData(headers);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo cargar el panel operativo.');
    } finally {
      this.loading = false;
    }
  }

  private async loadSucursalData(existingHeaders?: { Authorization: string }) {
    this.agenda = [];
    this.stock = [];
    if (!this.selectedSucursalUuid) return;

    const headers = existingHeaders ?? { Authorization: `Bearer ${await this.auth.getAccessToken()}` };
    const warnings: string[] = [];
    const [agenda, stock] = await Promise.all([
      this.getCatalogo(`${bffApiUrl}/api/agendas/sucursal/${this.selectedSucursalUuid}`, headers, false, 'agenda')
        .catch(() => {
          warnings.push('agenda');
          return [];
        }),
      this.getCatalogo(`${bffApiUrl}/api/inventario/stock`, headers, false, 'stock', { sucursalUuid: this.selectedSucursalUuid })
        .catch(() => {
          warnings.push('stock');
          return [];
        })
    ]);

    this.agenda = agenda.map(item => this.fromAgenda(item));
    this.stock = stock.map(item => this.fromStock(item));
    this.warning = warnings.length ? `No se pudo cargar ${warnings.join(' y ')}.` : null;
  }

  private async getCatalogo(
    url: string,
    headers: { Authorization: string },
    required: boolean,
    nombre: string,
    params?: Record<string, string>
  ) {
    try {
      const response = await lastValueFrom(this.http.get(url, { headers, params }));
      return this.extractPayload<any>(response);
    } catch (err) {
      if (required) throw new Error(`No se pudo cargar ${nombre}.`);
      return [];
    }
  }

  private fromCatalogo(item: any): CatalogoItem {
    return {
      uuid: String(item.uuid ?? ''),
      codigo: String(item.codigo ?? ''),
      nombre: String(item.nombre ?? 'Sin nombre'),
      activo: this.isActivo(item.activo)
    };
  }

  private fromCotizacion(item: any, index: number): DashboardCotizacion {
    const pagador = item.pagador ?? item.cliente ?? item.terceroPagador ?? item.tercero_pagador;
    const fallecido = item.fallecido ?? item.terceroFallecido ?? item.tercero_fallecido;
    const estadoCodigo = String(item.estado?.codigo ?? item.estadoCodigo ?? item.estado_codigo ?? 'BORRADOR');
    return {
      uuid: String(item.uuid ?? item.id ?? ''),
      numero: String(item.numero ?? item.folio ?? item.codigo ?? index + 1),
      fecha: String(item.fecha ?? item.fechaEmision ?? item.fecha_emision ?? ''),
      cliente: this.nombrePersona(pagador) || item.pagadorNombre || item.clienteNombre || 'No informado',
      fallecido: this.nombrePersona(fallecido) || item.fallecidoNombre || 'No informado',
      plan: item.plan?.nombre ?? item.planNombre ?? item.plan_nombre ?? 'No informado',
      estado: this.formatEstado(item.estado?.nombre ?? item.estadoNombre ?? item.estado_nombre ?? estadoCodigo),
      estadoCodigo,
      total: Number(item.total ?? item.montoTotal ?? item.monto_total ?? 0),
      sucursalUuid: String(item.sucursal?.uuid ?? item.sucursalUuid ?? item.sucursal_uuid ?? '')
    };
  }

  private fromAgenda(item: any): DashboardAgenda {
    const inicio = this.parseDate(item.fechaHoraInicio);
    const fin = this.parseDate(item.fechaHoraFin);
    return {
      uuid: String(item.uuid ?? ''),
      recurso: String(item.tipoRecursoNombre ?? item.recursoNombre ?? item.tipoRecurso?.nombre ?? 'Recurso'),
      titulo: item.cotizacionNumero ? `Cotización ${item.cotizacionNumero}` : String(item.estado ?? 'Agenda'),
      observacion: String(item.observacion ?? item.sucursalNombre ?? 'Sin observación'),
      estado: String(item.estado ?? 'OCUPADO'),
      inicio,
      fin
    };
  }

  private fromStock(item: any): StockResumen {
    return {
      productoUuid: String(item.productoUuid ?? ''),
      codigo: String(item.productoCodigo ?? ''),
      nombre: String(item.productoNombre ?? 'Producto'),
      unidad: String(item.unidadMedidaNombre ?? item.unidadMedidaCodigo ?? ''),
      stockActual: Number(item.stockActual ?? 0)
    };
  }

  private nombrePersona(item: any) {
    if (!item) return '';
    return item.nombreCompleto
      ?? item.nombre_completo
      ?? item.razonSocial
      ?? item.razon_social
      ?? [item.nombres, item.apellidoPaterno ?? item.apellido_paterno, item.apellidoMaterno ?? item.apellido_materno]
        .filter(Boolean).join(' ');
  }

  private overlapsDate(item: DashboardAgenda, dateValue: string) {
    const start = item.inicio ? this.toDateInput(item.inicio) : '';
    const end = item.fin ? this.toDateInput(item.fin) : start;
    return !!start && start <= dateValue && end >= dateValue;
  }

  private formatDateTime(date: Date) {
    return `${date.toLocaleDateString('es-CL')} ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private formatDateLong(value: string) {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  private parseDate(value?: string) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private timeValue(date: Date | null) {
    return date?.getTime() ?? 0;
  }

  private sortDate(value: string) {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private isActivo(value: any) {
    return value === undefined
      || value === null
      || value === true
      || value === 1
      || value === '1'
      || String(value).toLocaleLowerCase('es-CL') === 'true';
  }

  private isFinalEstado(value: string) {
    const estado = String(value || '').toLocaleUpperCase('es-CL');
    return estado.includes('GEN_CONTR') || estado.includes('ANUL') || estado.includes('RECHAZ');
  }

  private isCancelledEstado(value: string) {
    const estado = String(value || '').toLocaleUpperCase('es-CL');
    return estado.includes('ANUL') || estado.includes('RECHAZ');
  }

  private formatEstado(value: any) {
    const estado = String(value || 'Borrador').replace(/_/g, ' ').toLocaleLowerCase('es-CL');
    return estado.charAt(0).toLocaleUpperCase('es-CL') + estado.slice(1);
  }

  private extractPayload<T>(response: any): T[] {
    const payload = this.unwrapPayload<any>(response);
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? payload?.items ?? [];
  }

  private unwrapPayload<T>(response: any): T {
    return response?.payload?.payload ?? response?.payload ?? response;
  }

  private getErrorMessage(err: any, fallback: string) {
    return ErrorMessageService.userMessage(err, fallback);
  }
}
