import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { CLP } from '../../data/ui-data';
import { Servicio, Sucursal, SuscripcionPlan, Tercero } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';
import { ErrorMessageService } from '../../services/error-message.service';

interface CatalogItem {
  id: number;
  uuid: string;
  nombre: string;
}

interface CotizacionOption {
  uuid: string;
  numero: string;
  cliente: string;
  clienteUuid: string;
  responsable: string;
  fallecido: string;
  fallecidoRut: string;
  total: number;
  sucursalUuid: string;
  planUuid: string;
  motivoUuid: string;
}

interface AgendaOption {
  uuid: string;
  nombre: string;
  sucursalUuid: string;
  cotizacionUuid: string;
  programada: boolean;
}

interface PagoResumen {
  cotizacionUuid: string;
  monto: number;
  estado: string;
}

type ServicioView = Servicio & {
  activo: boolean;
  tercero_uuid?: string;
  plan_uuid?: string;
  sucursal_uuid?: string;
  motivo_uuid?: string;
  responsable_uuid?: string;
};

@Component({
  selector: 'app-casos',
  templateUrl: './casos.component.html',
  styleUrls: ['./casos.component.css']
})
export class CasosComponent implements OnInit {
  private servicioDisponible = true;
  cases: ServicioView[] = [];
  clientes: Tercero[] = [];
  planes: SuscripcionPlan[] = [];
  sucursales: Sucursal[] = [];
  motivos: CatalogItem[] = [];
  responsables: CatalogItem[] = [];
  cotizaciones: CotizacionOption[] = [];
  agendas: AgendaOption[] = [];
  pagos: PagoResumen[] = [];

  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedCase: ServicioView | null = null;
  casePendingDeactivate: ServicioView | null = null;
  form: Partial<ServicioView> = this.createEmptyForm();

  clp = CLP;
  tab = 'Todas';
  tabs = ['Todas', 'En curso', 'Programado', 'Pendiente', 'Completado', 'Anulado'];

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
    await this.loadServicios();
  }

  get rows() {
    return this.tab === 'Todas'
      ? this.cases
      : this.cases.filter(item => this.getEstadoLabel(item.estado) === this.tab);
  }

  get activeCount() {
    return this.cases.filter(item => item.activo && !['COMPLETADO', 'ANULADO'].includes(item.estado)).length;
  }

  get serviciosDisponibles() {
    return this.servicioDisponible;
  }

  setTab(value: string) {
    this.tab = value;
  }

  trackById(index: number, item: ServicioView) {
    return item.uuid || item.id;
  }

  openNew() {
    this.clearMessages();
    this.casePendingDeactivate = null;
    this.isEditing = false;
    this.selectedCase = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(item: ServicioView) {
    this.clearMessages();
    this.casePendingDeactivate = null;
    if (!item.activo) {
      this.error = 'No se puede editar un servicio desactivado.';
      return;
    }

    this.isEditing = true;
    this.selectedCase = item;
    this.form = { ...item };
    this.formVisible = true;
  }

  delete(item: ServicioView) {
    if (!item.activo) {
      this.error = 'El servicio ya esta desactivado.';
      return;
    }

    this.formVisible = false;
    this.isEditing = false;
    this.selectedCase = null;
    this.casePendingDeactivate = item;
    this.clearMessages();
  }

  async confirmDeactivate() {
    if (!this.casePendingDeactivate) return;

    const item = this.casePendingDeactivate;
    this.loading = true;
    this.clearMessages();

    try {
      if (this.servicioDisponible) {
        const token = await this.auth.getAccessToken();
        await lastValueFrom(this.http.patch(`${bffApiUrl}/api/servicios/${item.uuid}/desactivar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }));
        await this.loadServicios();
      } else {
        this.error = 'El servicio no se encuentra disponible temporalmente. Intente nuevamente mas tarde.';
        return;
      }
      this.success = 'Servicio funerario desactivado correctamente.';
      this.casePendingDeactivate = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo desactivar el servicio funerario.');
    } finally {
      this.loading = false;
    }
  }

  cancelDeactivate() {
    this.casePendingDeactivate = null;
  }

  async save() {
    this.clearMessages();

    if (!this.form.folio) {
      this.form.folio = this.generateFolio();
    }
    if (!this.form.cotizacion_uuid) {
      this.error = 'Selecciona la cotizacion asociada al servicio.';
      return;
    }
    const cotizacion = this.selectedCotizacion;
    if (!cotizacion?.clienteUuid || !cotizacion.sucursalUuid || !cotizacion.fallecido || !cotizacion.total) {
      this.error = 'La cotizacion seleccionada no tiene cliente, sucursal, fallecido o monto total. Revise el detalle de la cotizacion.';
      return;
    }
    if (this.cotizacionTieneAgendaProgramada(cotizacion.uuid) && !this.esCotizacionDelServicioActual(cotizacion.uuid)) {
      this.error = 'La cotizacion seleccionada ya tiene una agenda con horarios programados.';
      return;
    }

    this.saving = true;
    const item = this.getFullServicioFromForm();

    try {
      if (!this.servicioDisponible) {
        this.error = 'El servicio no se encuentra disponible temporalmente. Intente nuevamente mas tarde.';
        return;
      }

      const token = await this.auth.getAccessToken();
      if (this.isEditing && this.selectedCase) {
        await lastValueFrom(this.http.put(`${bffApiUrl}/api/servicios/${this.selectedCase.uuid}`, this.toApiPayload(item), {
          headers: { Authorization: `Bearer ${token}` }
        }));
        this.success = 'Servicio funerario actualizado correctamente.';
      } else {
        await lastValueFrom(this.http.post(`${bffApiUrl}/api/servicios`, this.toApiPayload(item), {
          headers: { Authorization: `Bearer ${token}` }
        }));
        this.success = 'Servicio funerario creado correctamente.';
      }
      await this.loadServicios();
      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el servicio funerario.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedCase = null;
    this.form = this.createEmptyForm();
  }

  getEstadoLabel(estado: Servicio['estado']) {
    const labels: Record<Servicio['estado'], string> = {
      PENDIENTE: 'Pendiente',
      PROGRAMADO: 'Programado',
      EN_CURSO: 'En curso',
      COMPLETADO: 'Completado',
      ANULADO: 'Anulado'
    };
    return labels[estado] || estado;
  }

  getSaldo(item: ServicioView) {
    const pagosCotizacion = this.pagos.filter(pago =>
      pago.estado.toLocaleUpperCase('es-CL') !== 'ANULADO' && pago.cotizacionUuid && pago.cotizacionUuid === item.cotizacion_uuid
    );
    if (pagosCotizacion.length) {
      const total = Number(item.monto_total || this.cotizaciones.find(row => row.uuid === item.cotizacion_uuid)?.total || 0);
      const pagado = pagosCotizacion.reduce((sum, pago) => sum + pago.monto, 0);
      return Math.max(0, total - pagado);
    }
    if (item.saldo_pendiente !== undefined && item.saldo_pendiente !== null) {
      return Math.max(0, Number(item.saldo_pendiente || 0));
    }
    return Math.max(0, Number(item.monto_total || 0) - Number(item.monto_pagado || 0));
  }

  get agendasFiltradas() {
    if (!this.form.cotizacion_uuid) return [];
    return this.agendas.filter(item => {
      const byCotizacion = !item.cotizacionUuid || item.cotizacionUuid === this.form.cotizacion_uuid;
      return byCotizacion;
    });
  }

  get cotizacionesDisponibles() {
    return this.cotizaciones.filter(item =>
      !this.cotizacionTieneAgendaProgramada(item.uuid) || this.esCotizacionDelServicioActual(item.uuid)
    );
  }

  get selectedCotizacion() {
    return this.cotizaciones.find(item => item.uuid === this.form.cotizacion_uuid) || null;
  }

  get estadoFormulario() {
    return this.getEstadoLabel(this.getEstadoOperativo(this.form));
  }

  onCotizacionChange() {
    const cotizacion = this.selectedCotizacion;
    this.form.agenda_uuid = '';
    if (!cotizacion) return;
    this.form.cotizacion_numero = cotizacion.numero;
    if (!this.form.folio) this.form.folio = this.generateFolio();
  }

  private createEmptyForm(): Partial<ServicioView> {
    return {
      folio: this.generateFolio(),
      fallecido_nombre: '',
      fallecido_rut: '',
      estado: 'PENDIENTE',
      fecha_velatorio: '',
      fecha_ceremonia: '',
      destino: '',
      observacion: '',
      cotizacion_uuid: '',
      agenda_uuid: '',
      activo: true
    };
  }

  private getFullServicioFromForm(): ServicioView {
    return {
      id: Number(this.form.id || 0),
      uuid: this.form.uuid || '',
      folio: this.form.folio || '',
      cotizacion_uuid: this.form.cotizacion_uuid || undefined,
      cotizacion_numero: this.form.cotizacion_numero || undefined,
      tercero_id: Number(this.form.tercero_id || 0),
      tercero_nombre: this.form.tercero_nombre || '',
      tercero_rut: this.form.tercero_rut || '',
      fallecido_nombre: this.form.fallecido_nombre || '',
      fallecido_rut: this.form.fallecido_rut || '',
      motivo_fallecimiento_id: Number(this.form.motivo_fallecimiento_id || 0),
      suscripcion_plan_id: Number(this.form.suscripcion_plan_id || 0),
      plan_nombre: this.form.plan_nombre || '',
      estado: this.getEstadoOperativo(this.form),
      sucursal_id: Number(this.form.sucursal_id || 0),
      sucursal_nombre: this.form.sucursal_nombre || '',
      agenda_uuid: this.form.agenda_uuid || undefined,
      sala_nombre: this.form.sala_nombre || '',
      responsable_usuario_id: Number(this.form.responsable_usuario_id || 0),
      responsable_nombre: this.form.responsable_nombre || '',
      fecha_ingreso: this.form.fecha_ingreso || '',
      monto_total: Number(this.form.monto_total || 0),
      monto_pagado: Number(this.form.monto_pagado || 0),
      saldo_pendiente: this.form.saldo_pendiente,
      fecha_velatorio: this.form.fecha_velatorio || undefined,
      fecha_ceremonia: this.form.fecha_ceremonia || undefined,
      fecha_termino: undefined,
      destino: this.form.destino || undefined,
      observacion: this.form.observacion || undefined,
      activo: this.form.activo !== false
    };
  }

  private async loadServicios() {
    this.loading = true;
    this.error = null;
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/servicios`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.cases = this.extractPayload<any>(response).map((item, index) => this.fromApiServicio(item, index));
      this.servicioDisponible = true;
    } catch (err: any) {
      this.servicioDisponible = false;
      this.cases = [];
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los servicios funerarios.');
    } finally {
      this.loading = false;
    }
  }

  private async loadCatalogos() {
    const token = await this.auth.getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    const safeGet = async (path: string) => {
      try {
        return this.extractPayload<any>(await lastValueFrom(this.http.get(`${bffApiUrl}${path}`, { headers })));
      } catch {
        return [];
      }
    };

    const [clientes, planes, sucursales, motivos, usuarios, cotizaciones, agendas, pagos] = await Promise.all([
      safeGet('/api/clientes'),
      safeGet('/api/planes'),
      safeGet('/api/sucursales'),
      safeGet('/api/motivos-fallecimiento'),
      safeGet('/api/usuarios'),
      safeGet('/api/cotizaciones'),
      safeGet('/api/agendas'),
      safeGet('/api/pagos')
    ]);

    if (clientes.length) this.clientes = clientes.map((item, index) => this.fromApiCliente(item, index));
    if (planes.length) this.planes = planes.map((item, index) => this.fromApiPlan(item, index));
    if (sucursales.length) this.sucursales = sucursales.map((item, index) => this.fromApiSucursal(item, index));
    if (motivos.length) this.motivos = motivos.map((item, index) => this.fromApiCatalogItem(item, index));
    if (usuarios.length) this.responsables = usuarios.map((item, index) => ({
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      nombre: [item.nombre, item.paterno, item.materno].filter(Boolean).join(' ') || item.email || `Usuario ${index + 1}`
    }));
    if (cotizaciones.length) this.cotizaciones = cotizaciones.map((item, index) => this.fromApiCotizacion(item, index));
    if (agendas.length) this.agendas = agendas.map((item, index) => this.fromApiAgenda(item, index));
    this.pagos = pagos.map(item => this.fromApiPago(item));

    this.form = this.createEmptyForm();
  }

  private toApiPayload(item: ServicioView) {
    const cotizacion = this.cotizaciones.find(row => row.uuid === item.cotizacion_uuid);
    return {
      folio: item.folio,
      fallecidoNombre: cotizacion?.fallecido || item.fallecido_nombre,
      fallecidoRut: cotizacion?.fallecidoRut || item.fallecido_rut || null,
      estado: this.getEstadoOperativo(item),
      fechaIngreso: this.toBackendDateTime(item.fecha_ingreso) || this.currentBackendDateTime(),
      fechaVelatorio: this.toBackendDateTime(item.fecha_velatorio),
      fechaCeremonia: this.toBackendDateTime(item.fecha_ceremonia),
      fechaTermino: null,
      destino: item.destino || null,
      montoTotal: cotizacion?.total || item.monto_total,
      montoPagado: item.monto_pagado || 0,
      observacion: item.observacion || null,
      cotizacionUuid: item.cotizacion_uuid || null,
      terceroUuid: cotizacion?.clienteUuid || item.tercero_uuid,
      sucursalUuid: cotizacion?.sucursalUuid || item.sucursal_uuid,
      agendaUuid: item.agenda_uuid || null
    };
  }

  private fromApiServicio(item: any, index: number): ServicioView {
    const terceroUuid = item.terceroUuid ?? item.tercero_uuid ?? item.tercero?.uuid;
    const planUuid = item.suscripcionPlanUuid ?? item.planUuid ?? item.suscripcion_plan_uuid ?? item.plan?.uuid;
    const sucursalUuid = item.sucursalUuid ?? item.sucursal_uuid ?? item.sucursal?.uuid;
    const motivoUuid = item.motivoFallecimientoUuid ?? item.motivo_fallecimiento_uuid ?? item.motivoFallecimiento?.uuid;
    const responsableUuid = item.responsableUsuarioUuid ?? item.responsable_usuario_uuid ?? item.responsableUsuario?.uuid;
    const cotizacionUuid = item.cotizacionUuid ?? item.cotizacion_uuid ?? item.cotizacion?.uuid;
    const agendaUuid = item.agendaUuid ?? item.agenda_uuid ?? item.agenda?.uuid;
    const cliente = this.clientes.find(row => row.uuid === terceroUuid);
    const plan = this.planes.find(row => row.uuid === planUuid);
    const sucursal = this.sucursales.find(row => row.uuid === sucursalUuid);
    const motivo = this.motivos.find(row => row.uuid === motivoUuid);
    const responsable = this.responsables.find(row => row.uuid === responsableUuid);
    const cotizacion = this.cotizaciones.find(row => row.uuid === cotizacionUuid);
    const estado = this.normalizeEstado(item.estado);

    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      folio: item.folio ?? '',
      cotizacion_uuid: cotizacionUuid,
      cotizacion_numero: String(item.cotizacionNumero ?? item.cotizacion_numero ?? item.cotizacion?.numero ?? cotizacion?.numero ?? ''),
      tercero_id: cliente?.id || Number(item.tercero_id ?? item.terceroId ?? 0),
      tercero_nombre: item.terceroNombre ?? item.tercero_nombre ?? item.tercero?.nombreCompleto ?? cliente?.nombre_completo ?? cotizacion?.responsable ?? cotizacion?.cliente ?? '',
      tercero_rut: String(item.terceroRut ?? item.tercero_rut ?? item.tercero?.rut ?? cliente?.ruc ?? ''),
      fallecido_nombre: item.fallecidoNombre ?? item.fallecido_nombre ?? cotizacion?.fallecido ?? '',
      fallecido_rut: String(item.fallecidoRut ?? item.fallecido_rut ?? cotizacion?.fallecidoRut ?? ''),
      motivo_fallecimiento_id: motivo?.id || Number(item.motivo_fallecimiento_id ?? item.motivoFallecimientoId ?? 0),
      suscripcion_plan_id: plan?.id || Number(item.suscripcion_plan_id ?? item.suscripcionPlanId ?? 0),
      plan_nombre: item.planNombre ?? item.plan_nombre ?? item.suscripcionPlan?.nombre ?? plan?.nombre ?? '',
      estado,
      sucursal_id: sucursal?.id || Number(item.sucursal_id ?? item.sucursalId ?? 0),
      sucursal_nombre: item.sucursalNombre ?? item.sucursal_nombre ?? item.sucursal?.nombre ?? sucursal?.nombre ?? '',
      agenda_uuid: agendaUuid,
      sala_nombre: item.salaNombre ?? item.sala_nombre ?? item.agenda?.salaNombre ?? '',
      responsable_usuario_id: responsable?.id || Number(item.responsable_usuario_id ?? item.responsableUsuarioId ?? 0),
      responsable_nombre: item.responsableNombre ?? item.responsable_nombre ?? responsable?.nombre ?? '',
      fecha_ingreso: this.toDateInputValue(item.fechaIngreso ?? item.fecha_ingreso ?? ''),
      monto_total: Number(item.montoTotal ?? item.monto_total ?? cotizacion?.total ?? 0),
      monto_pagado: Number(item.montoPagado ?? item.monto_pagado ?? 0),
      saldo_pendiente: item.saldoPendiente ?? item.saldo_pendiente,
      fecha_velatorio: this.toDateTimeInputValue(item.fechaVelatorio ?? item.fecha_velatorio),
      fecha_ceremonia: this.toDateTimeInputValue(item.fechaCeremonia ?? item.fecha_ceremonia),
      fecha_termino: this.toDateTimeInputValue(item.fechaTermino ?? item.fecha_termino),
      destino: item.destino,
      observacion: item.observacion,
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      tercero_uuid: terceroUuid,
      plan_uuid: planUuid,
      sucursal_uuid: sucursalUuid,
      motivo_uuid: motivoUuid,
      responsable_uuid: responsableUuid
    };
  }

  private fromApiCliente(item: any, index: number): Tercero {
    const nombre = item.nombreCompleto ?? item.nombre_completo ?? item.razonSocial ?? '';
    return {
      id: Number(item.id ?? index + 1), uuid: item.uuid, nombre_completo: nombre,
      nombres: item.nombres ?? nombre, apellido_paterno: item.apellidoPaterno ?? '', apellido_materno: item.apellidoMaterno ?? '',
      ruc: String(item.rut ?? item.ruc ?? ''), dv: item.dv ?? '', email: item.email ?? '', telefono: item.telefono ?? '',
      tipo_persona: item.tipoPersona === 'J' ? 'empresa' : 'persona_natural', comuna_id: Number(item.comunaId ?? 0), empresa_id: Number(item.empresaId ?? 0), rol: 'CLIENTE'
    };
  }

  private fromApiPlan(item: any, index: number): SuscripcionPlan {
    return { id: Number(item.id ?? index + 1), uuid: item.uuid, nombre: item.nombre ?? '', descripcion: item.descripcion ?? '', valor: Number(item.valor ?? 0), activo: item.activo !== 0 && item.activo !== false };
  }

  private fromApiSucursal(item: any, index: number): Sucursal {
    return { id: Number(item.id ?? index + 1), uuid: item.uuid, codigo: item.codigo ?? '', nombre: item.nombre ?? '', direccion: item.direccion ?? '', telefono: item.telefono ?? '', activo: item.activo !== 0 && item.activo !== false, empresa_id: Number(item.empresaId ?? 0), comuna_id: Number(item.comunaId ?? 0) };
  }

  private fromApiCatalogItem(item: any, index: number): CatalogItem {
    return { id: Number(item.id ?? index + 1), uuid: item.uuid, nombre: item.nombre ?? item.descripcion ?? `Opcion ${index + 1}` };
  }

  private fromApiCotizacion(item: any, index: number): CotizacionOption {
    const pagador = item.pagador ?? item.cliente ?? item.terceroPagador ?? item.tercero_pagador;
    const responsable = item.familiarResponsable
      ?? item.familiar_responsable
      ?? item.responsable
      ?? item.terceroResponsable
      ?? item.tercero_responsable
      ?? pagador;
    const fallecido = item.fallecido ?? item.terceroFallecido ?? item.tercero_fallecido;
    const sucursal = item.sucursal ?? {};
    const plan = item.plan ?? item.suscripcionPlan ?? item.suscripcion_plan ?? {};
    const motivo = item.motivoFallecimiento ?? item.motivo_fallecimiento ?? {};
    const responsableNombre = this.nombrePersona(responsable)
      || item.familiarResponsableNombre
      || item.familiar_responsable_nombre
      || item.responsableNombre
      || item.responsable_nombre
      || item.pagadorNombre
      || item.clienteNombre
      || 'No informado';
    return {
      uuid: String(item.uuid ?? ''),
      numero: String(item.numero ?? item.folio ?? item.codigo ?? index + 1),
      cliente: this.nombrePersona(pagador) || item.pagadorNombre || item.clienteNombre || responsableNombre,
      clienteUuid: String(
        item.familiarResponsableUuid
        ?? item.familiar_responsable_uuid
        ?? item.responsableUuid
        ?? item.responsable_uuid
        ?? item.terceroResponsableUuid
        ?? item.tercero_responsable_uuid
        ?? item.terceroUuid
        ?? item.clienteUuid
        ?? item.pagadorUuid
        ?? item.terceroPagadorUuid
        ?? item.tercero_pagador_uuid
        ?? responsable?.uuid
        ?? pagador?.uuid
        ?? ''
      ),
      responsable: responsableNombre,
      fallecido: this.nombrePersona(fallecido) || item.fallecidoNombre || item.fallecido_nombre || 'No informado',
      fallecidoRut: this.rutPersona(fallecido) || String(item.fallecidoRut ?? item.fallecido_rut ?? ''),
      total: Number(item.total ?? item.montoTotal ?? item.monto_total ?? 0),
      sucursalUuid: String(item.sucursalUuid ?? item.sucursal_uuid ?? sucursal.uuid ?? ''),
      planUuid: String(item.suscripcionPlanUuid ?? item.planUuid ?? item.suscripcion_plan_uuid ?? plan.uuid ?? ''),
      motivoUuid: String(item.motivoFallecimientoUuid ?? item.motivo_fallecimiento_uuid ?? motivo.uuid ?? '')
    };
  }

  private fromApiAgenda(item: any, index: number): AgendaOption {
    const recurso = item.tipoRecurso ?? item.tipo_recurso ?? {};
    const sucursal = item.sucursal ?? {};
    const inicio = this.formatFechaHora(item.fechaHoraInicio ?? item.fecha_hora_inicio);
    const fin = this.formatFechaHora(item.fechaHoraFin ?? item.fecha_hora_fin);
    return {
      uuid: String(item.uuid ?? ''),
      nombre: [
        item.tipoRecursoNombre ?? item.tipo_recurso_nombre ?? recurso.nombre ?? `Agenda ${index + 1}`,
        inicio && fin ? `${inicio} - ${fin}` : inicio
      ].filter(Boolean).join(' · '),
      sucursalUuid: String(item.sucursalUuid ?? item.sucursal_uuid ?? sucursal.uuid ?? ''),
      cotizacionUuid: String(item.cotizacionUuid ?? item.cotizacion_uuid ?? item.cotizacion?.uuid ?? ''),
      programada: !!(item.fechaHoraInicio ?? item.fecha_hora_inicio ?? item.fechaHoraFin ?? item.fecha_hora_fin)
    };
  }

  private fromApiPago(item: any): PagoResumen {
    return {
      cotizacionUuid: String(item.cotizacionUuid ?? item.cotizacion_uuid ?? item.cotizacion?.uuid ?? ''),
      monto: Number(item.monto ?? 0),
      estado: String(item.estado ?? 'REGISTRADO')
    };
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? payload?.items ?? [];
  }

  private clearMessages() {
    this.error = null;
    this.success = null;
  }

  private getErrorMessage(err: any, fallback: string) {
    return ErrorMessageService.userMessage(err, fallback);
  }

  private normalizeEstado(value: any): Servicio['estado'] {
    const estado = String(value || 'PENDIENTE').trim().toLocaleUpperCase('es-CL').replace(/ /g, '_');
    return ['PENDIENTE', 'PROGRAMADO', 'EN_CURSO', 'COMPLETADO', 'ANULADO'].includes(estado)
      ? estado as Servicio['estado']
      : 'PENDIENTE';
  }

  private getEstadoOperativo(item: Partial<ServicioView>): Servicio['estado'] {
    const estadoActual = this.normalizeEstado(item.estado);
    if (['EN_CURSO', 'COMPLETADO', 'ANULADO'].includes(estadoActual)) return estadoActual;
    return item.agenda_uuid || item.fecha_velatorio || item.fecha_ceremonia ? 'PROGRAMADO' : 'PENDIENTE';
  }

  private toBackendDateTime(value?: string) {
    if (!value) return null;
    if (value.length === 10) return `${value}T00:00:00`;
    if (value.length === 16) return `${value}:00`;
    return value;
  }

  private toDateInputValue(value: any) {
    return value ? String(value).slice(0, 10) : '';
  }

  private toDateTimeInputValue(value: any) {
    if (!value) return '';
    return String(value).slice(0, 16);
  }

  private currentBackendDateTime() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  }

  private formatFechaHora(value: any) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
    return date.toLocaleDateString('es-CL') + ' ' + date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
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

  private rutPersona(item: any) {
    if (!item) return '';
    const rut = item.rut ?? item.ruc ?? '';
    const dv = item.dv ?? '';
    return rut ? `${rut}${dv ? `-${dv}` : ''}` : '';
  }

  private cotizacionTieneAgendaProgramada(cotizacionUuid?: string) {
    return !!cotizacionUuid && this.agendas.some(item => item.cotizacionUuid === cotizacionUuid && item.programada);
  }

  private esCotizacionDelServicioActual(cotizacionUuid?: string) {
    return !!cotizacionUuid && !!this.selectedCase?.cotizacion_uuid && this.selectedCase.cotizacion_uuid === cotizacionUuid;
  }

  private generateFolio() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SF-${year}-${random}`;
  }
}
