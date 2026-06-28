import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { AG_COLOR } from '../../data/mock-data';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';

interface CatalogoItem {
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

interface AgendaApi {
  uuid?: string;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  estado?: string;
  observacion?: string;
  tipoRecursoUuid?: string;
  tipoRecursoNombre?: string;
  sucursalUuid?: string;
  sucursalNombre?: string;
  cotizacionUuid?: string;
  cotizacionNumero?: number;
}

interface AgendaEvent {
  uuid?: string;
  sala: number;
  start: number;
  end: number;
  tipo: string;
  titulo: string;
  sub: string;
  color: keyof typeof AG_COLOR;
  fechaHoraInicio?: string;
  fechaHoraFin?: string;
  estado?: string;
  fechaKey?: string;
  fechaInicioKey?: string;
  fechaFinKey?: string;
}

interface AgendaForm {
  fechaInicio: string;
  fechaTermino: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  observacion: string;
  tipoRecursoUuid: string;
  sucursalUuid: string;
  cotizacionUuid: string;
}

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css']
})
export class AgendaComponent implements OnInit {
  agenda: AgendaEvent[] = [];
  sucursales: CatalogoItem[] = [];
  tiposRecurso: CatalogoItem[] = [];
  cotizaciones: CatalogoItem[] = [];
  selectedSucursalUuid = '';
  selectedDate = this.toDateInput(new Date());
  viewMode: 'dia' | 'semana' = 'dia';
  formVisible = false;
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  form: AgendaForm = this.createForm();
  hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  agColor = AG_COLOR;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
  }

  get salas() {
    return this.tiposRecurso.map(item => item.nombre);
  }

  get visibleAgenda() {
    return this.agenda.filter(item => this.isInCurrentRange(item.fechaKey, item));
  }

  get visibleEvents() {
    return this.visibleAgenda.filter((a) => a.color !== 'neutral');
  }

  get canReserve() {
    return !this.loading && !this.saving && !!this.sucursales.length && !!this.tiposRecurso.length;
  }

  get agendaGridColumns() {
    return `60px repeat(${Math.max(1, this.salas.length)}, minmax(150px, 1fr))`;
  }

  get rangeTitle() {
    if (this.viewMode === 'dia') return this.formatDateLabel(this.selectedDate);
    return `${this.formatDateLabel(this.selectedDate)} a ${this.formatDateLabel(this.addDays(this.selectedDate, 6))}`;
  }

  eventAt(hour: number, salaIndex: number) {
    return this.visibleAgenda.find((a) => a.sala === salaIndex && Math.floor(a.start) === hour);
  }

  getEventsCount(salaIndex: number) {
    return this.visibleAgenda.filter((a) => a.sala === salaIndex).length;
  }

  getEventsCountLabel(salaIndex: number) {
    const count = this.getEventsCount(salaIndex);
    const suffix = this.viewMode === 'dia' ? 'en el día' : 'en la semana';
    return `${count} evento${count !== 1 ? 's' : ''} ${suffix}`;
  }

  getEventStyle(ev: any) {
    const color = this.agColor[ev.color as keyof typeof this.agColor] || this.agColor.neutral;
    return {
      height: (ev.end - ev.start) * 46 - 4 + 'px',
      background: color.bg,
      borderLeftColor: color.bar,
      color: color.fg,
      cursor: 'pointer'
    };
  }

  formatHour(hour: number) {
    const wholeHour = Math.floor(hour);
    const minutes = Math.round((hour - wholeHour) * 60);
    return `${wholeHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  formatHourLabel(hour: number) {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  formatEventDates(ev: AgendaEvent) {
    const inicio = ev.fechaInicioKey || ev.fechaKey || '';
    const fin = ev.fechaFinKey || inicio;
    if (!inicio) return 'Fecha no informada';
    if (inicio === fin) return this.formatDateLabel(inicio);
    return `${this.formatDateLabel(inicio)} al ${this.formatDateLabel(fin)}`;
  }

  formatEventSchedule(ev: AgendaEvent) {
    return `${this.formatEventDates(ev)} · ${this.formatHour(ev.start)}-${this.formatHour(ev.end)}`;
  }

  isOccupied(salaIndex: number) {
    return this.visibleAgenda.some((a) => a.sala === salaIndex && a.color === 'ok');
  }

  async onSucursalChange() {
    await this.loadAgenda();
  }

  onDateChange() {
    this.clearMessages();
  }

  setViewMode(mode: 'dia' | 'semana') {
    this.viewMode = mode;
  }

  openReserva() {
    this.clearMessages();
    this.form = this.createForm();
    this.form.sucursalUuid = this.selectedSucursalUuid || this.sucursales[0]?.uuid || '';
    this.form.tipoRecursoUuid = this.findVelatorioTipoRecurso()?.uuid || this.tiposRecurso[0]?.uuid || '';
    this.form.cotizacionUuid = this.cotizaciones[0]?.uuid || '';
    this.formVisible = true;
  }

  cancelReserva() {
    this.formVisible = false;
    this.form = this.createForm();
  }

  async registrarAgenda() {
    this.clearMessages();
    const validation = this.validateAgenda();
    if (validation) {
      this.error = validation;
      return;
    }

    this.saving = true;
    try {
      const token = await this.auth.getAccessToken();
      await lastValueFrom(this.http.post(
        `${bffApiUrl}/api/agendas`,
        this.toApiPayload(),
        { headers: { Authorization: `Bearer ${token}` } }
      ));
      this.selectedSucursalUuid = this.form.sucursalUuid;
      this.formVisible = false;
      await this.loadAgenda();
      this.success = 'Servicio agendado correctamente.';
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo agendar el servicio.');
    } finally {
      this.saving = false;
    }
  }

  private async loadCatalogos() {
    this.loading = true;
    this.clearMessages();
    try {
      const token = await this.auth.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [sucursales, tiposRecurso, cotizaciones] = await Promise.all([
        this.getCatalogo(`${bffApiUrl}/api/sucursales`, headers, true),
        this.getCatalogo(`${bffApiUrl}/api/tipos-recurso`, headers, true),
        this.getCatalogo(`${bffApiUrl}/api/cotizaciones`, headers)
      ]);

      this.sucursales = sucursales.map(item => this.fromCatalogo(item)).filter(item => item.activo);
      this.tiposRecurso = tiposRecurso.map(item => this.fromCatalogo(item)).filter(item => item.activo);
      this.cotizaciones = cotizaciones.map(item => ({
        uuid: String(item.uuid ?? ''),
        codigo: String(item.numero ?? item.numCotizacion ?? item.codigo ?? ''),
        nombre: this.getCotizacionNombre(item),
        activo: this.isActivo(item.activo)
      })).filter(item => item.uuid && item.activo);

      this.selectedSucursalUuid = this.sucursales[0]?.uuid || '';
      this.form = this.createForm();
      await this.loadAgenda(headers);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo cargar la agenda de servicios.');
    } finally {
      this.loading = false;
    }
  }

  private async loadAgenda(existingHeaders?: { Authorization: string }) {
    if (!this.selectedSucursalUuid) {
      this.agenda = [];
      return;
    }

    try {
      const headers = existingHeaders ?? { Authorization: `Bearer ${await this.auth.getAccessToken()}` };
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/agendas/sucursal/${this.selectedSucursalUuid}`, { headers }));
      const payload = this.extractPayload<any>(response);
      this.agenda = payload.length ? payload.map(item => this.fromApiAgenda(item)) : [];
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo consultar la agenda de la sucursal.');
    }
  }

  private async getCatalogo(url: string, headers: { Authorization: string }, required = false) {
    try {
      const response = await lastValueFrom(this.http.get(url, { headers }));
      return this.extractPayload<any>(response);
    } catch (err) {
      if (required) throw err;
      return [];
    }
  }

  private validateAgenda() {
    if (!this.form.sucursalUuid || !this.form.tipoRecursoUuid) {
      return 'Selecciona una sucursal y un recurso para agendar.';
    }
    if (!this.form.fechaInicio || !this.form.fechaTermino || !this.form.horaInicio || !this.form.horaFin) {
      return 'Indica fecha de inicio, fecha de término, hora de inicio y hora de término.';
    }
    if (new Date(this.toLocalDateTime(this.form.fechaTermino, this.form.horaFin)) <= new Date(this.toLocalDateTime(this.form.fechaInicio, this.form.horaInicio))) {
      return 'La fecha y hora de término deben ser posteriores al inicio.';
    }
    if (this.form.observacion.length > 500) {
      return 'La observación no puede superar los 500 caracteres.';
    }
    return null;
  }

  private toApiPayload() {
    return {
      fechaHoraInicio: this.toLocalDateTime(this.form.fechaInicio, this.form.horaInicio),
      fechaHoraFin: this.toLocalDateTime(this.form.fechaTermino, this.form.horaFin),
      estado: this.form.estado || 'OCUPADO',
      observacion: this.form.observacion.trim() || undefined,
      tipoRecursoUuid: this.form.tipoRecursoUuid,
      sucursalUuid: this.form.sucursalUuid,
      cotizacionUuid: this.form.cotizacionUuid || undefined
    };
  }

  private createForm(): AgendaForm {
    const today = this.toDateInput(new Date());
    return {
      fechaInicio: today,
      fechaTermino: today,
      horaInicio: '18:00',
      horaFin: '21:00',
      estado: 'OCUPADO',
      observacion: 'Velatorio',
      tipoRecursoUuid: '',
      sucursalUuid: this.selectedSucursalUuid,
      cotizacionUuid: ''
    };
  }

  private fromApiAgenda(item: AgendaApi): AgendaEvent {
    const inicio = this.parseDate(item.fechaHoraInicio);
    const fin = this.parseDate(item.fechaHoraFin);
    const tipoIndex = this.tiposRecurso.findIndex(tipo => tipo.uuid === item.tipoRecursoUuid);
    const start = inicio ? inicio.getHours() + inicio.getMinutes() / 60 : 8;
    const end = fin ? fin.getHours() + fin.getMinutes() / 60 : start + 1;
    return {
      uuid: item.uuid,
      sala: Math.max(0, tipoIndex),
      start,
      end,
      tipo: item.tipoRecursoNombre || this.tiposRecurso[tipoIndex]?.nombre || 'Servicio',
      titulo: item.cotizacionNumero ? `Cotización ${item.cotizacionNumero}` : item.estado || 'Agendado',
      sub: item.observacion || item.sucursalNombre || 'Agenda de servicio',
      color: this.colorByEstado(item.estado),
      fechaHoraInicio: item.fechaHoraInicio,
      fechaHoraFin: item.fechaHoraFin,
      estado: item.estado,
      fechaKey: this.toDateKey(inicio),
      fechaInicioKey: this.toDateKey(inicio),
      fechaFinKey: this.toDateKey(fin)
    };
  }

  private colorByEstado(estado?: string): keyof typeof AG_COLOR {
    const value = String(estado || '').toLocaleUpperCase('es-CL');
    if (value.includes('DISPONIBLE')) return 'neutral';
    return 'ok';
  }

  private fromCatalogo(item: any): CatalogoItem {
    return {
      uuid: String(item.uuid ?? ''),
      codigo: String(item.codigo ?? ''),
      nombre: String(item.nombre ?? item.descripcion ?? 'Sin nombre'),
      activo: this.isActivo(item.activo)
    };
  }

  private findVelatorioTipoRecurso() {
    return this.tiposRecurso.find(item => {
      const value = `${item.codigo} ${item.nombre}`.toLocaleLowerCase('es-CL');
      return value.includes('velatorio') || value.includes('velorio') || value.includes('sala');
    });
  }

  private getCotizacionNombre(item: any) {
    const numero = item.numero ?? item.numCotizacion ?? item.num_cotizacion ?? item.codigo;
    const cliente = item.clienteNombre ?? item.pagadorNombre ?? item.terceroNombre ?? item.nombreCliente;
    const fallecido = item.fallecidoNombre ?? item.nombreFallecido;
    return [numero ? `Cotización ${numero}` : 'Cotización', cliente, fallecido].filter(Boolean).join(' · ');
  }

  private extractPayload<T>(response: any): T[] {
    const payload = this.unwrapPayload<any>(response);
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? payload?.items ?? [];
  }

  private unwrapPayload<T>(response: any): T {
    return response?.payload?.payload ?? response?.payload ?? response;
  }

  private isActivo(value: any) {
    return value === undefined
      || value === null
      || value === true
      || value === 1
      || value === '1'
      || String(value).toLocaleLowerCase('es-CL') === 'true';
  }

  private parseDate(value?: string) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private isInCurrentRange(fechaKey?: string, item?: AgendaEvent) {
    const inicio = item?.fechaInicioKey || fechaKey;
    const fin = item?.fechaFinKey || inicio;
    if (!inicio || !fin) return false;
    const rangeStart = this.selectedDate;
    const rangeEnd = this.viewMode === 'dia' ? this.selectedDate : this.addDays(this.selectedDate, 6);
    return inicio <= rangeEnd && fin >= rangeStart;
  }

  private toDateKey(date: Date | null) {
    return date ? this.toDateInput(date) : '';
  }

  private addDays(dateValue: string, days: number) {
    const date = new Date(`${dateValue}T00:00:00`);
    date.setDate(date.getDate() + days);
    return this.toDateInput(date);
  }

  private formatDateLabel(dateValue: string) {
    const date = new Date(`${dateValue}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? dateValue
      : date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private toLocalDateTime(date: string, time: string) {
    return `${date}T${time.length === 5 ? `${time}:00` : time}`;
  }

  private toDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private clearMessages() {
    this.error = null;
    this.success = null;
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el BFF y el microservicio de agenda estén disponibles.';
    }
    const validation = err?.error?.errors ?? err?.error?.validationErrors;
    if (Array.isArray(validation) && validation.length) {
      return validation.map((item: any) => item.defaultMessage ?? item.message ?? item).join(' ');
    }
    if (validation && typeof validation === 'object') {
      return Object.values(validation).join(' ');
    }
    return this.cleanBackendMessage(err?.error?.message || err?.message || fallback);
  }

  private cleanBackendMessage(message: string) {
    const value = String(message || '').trim();
    const jsonStart = value.indexOf('{');
    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(value.slice(jsonStart));
        return parsed?.message || value.slice(0, jsonStart).trim() || value;
      } catch {
        const match = value.match(/"message"\s*:\s*"([^"]+)"/);
        if (match?.[1]) return match[1];
      }
    }
    return value;
  }
}
