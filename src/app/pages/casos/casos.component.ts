import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { CLP, SERVICIOS, SUSCRIPCION_PLANS, TERCEROS } from '../../data/mock-data';
import { Servicio, Sucursal, SuscripcionPlan, Tercero } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';
import { environment } from 'src/environments/environment.prod';

interface CatalogItem {
  id: number;
  uuid: string;
  nombre: string;
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
  private readonly storageKey = 'gesfun-servicios-funerarios';
  private backendAvailable = true;
  cases: ServicioView[] = SERVICIOS.map(item => ({ ...item, activo: true })) as ServicioView[];
  clientes: Tercero[] = TERCEROS.filter(item => item.rol === 'CLIENTE');
  planes: SuscripcionPlan[] = SUSCRIPCION_PLANS;
  sucursales: Sucursal[] = [];
  motivos: CatalogItem[] = [];
  responsables: CatalogItem[] = [];

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
  tabs = ['Todas', 'En curso', 'Programado', 'Pendiente', 'Completado'];

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
    return this.cases.filter(item => item.activo && item.estado !== 'completado').length;
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
      if (this.backendAvailable) {
        const token = await this.auth.getAccessToken();
        await lastValueFrom(this.http.patch(`${bffApiUrl}/api/servicios/${item.uuid}/desactivar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }));
        await this.loadServicios();
      } else {
        item.activo = false;
        this.persistLocalServicios();
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

    if (!this.form.folio || !this.form.fallecido_nombre || !this.form.fallecido_rut) {
      this.error = 'Completa folio, nombre y RUT del fallecido.';
      return;
    }
    if (!this.form.tercero_id || !this.form.suscripcion_plan_id || !this.form.sucursal_id) {
      this.error = 'Selecciona familiar responsable, plan y sucursal.';
      return;
    }
    if (Number(this.form.monto_pagado || 0) > Number(this.form.monto_total || 0)) {
      this.error = 'El monto pagado no puede ser mayor que el total.';
      return;
    }

    this.saving = true;
    const item = this.getFullServicioFromForm();

    try {
      if (this.backendAvailable) {
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
      } else {
        this.saveLocalServicio(item);
        this.success = this.isEditing
          ? 'Servicio funerario actualizado localmente.'
          : 'Servicio funerario creado localmente.';
      }
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
      pendiente: 'Pendiente',
      programado: 'Programado',
      en_curso: 'En curso',
      completado: 'Completado'
    };
    return labels[estado] || estado;
  }

  getSaldo(item: ServicioView) {
    return Math.max(0, Number(item.monto_total || 0) - Number(item.monto_pagado || 0));
  }

  private createEmptyForm(): Partial<ServicioView> {
    return {
      folio: '',
      tercero_id: this.clientes[0]?.id,
      fallecido_nombre: '',
      fallecido_rut: '',
      motivo_fallecimiento_id: this.motivos[0]?.id,
      suscripcion_plan_id: this.planes[0]?.id,
      estado: 'pendiente',
      sucursal_id: this.sucursales[0]?.id,
      responsable_usuario_id: this.responsables[0]?.id,
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      monto_total: Number(this.planes[0]?.valor || 0),
      monto_pagado: 0,
      fecha_velatorio: '',
      fecha_ceremonia: '',
      destino: '',
      activo: true
    };
  }

  private getFullServicioFromForm(): ServicioView {
    const cliente = this.clientes.find(item => item.id === Number(this.form.tercero_id));
    const plan = this.planes.find(item => item.id === Number(this.form.suscripcion_plan_id));
    const sucursal = this.sucursales.find(item => item.id === Number(this.form.sucursal_id));
    const responsable = this.responsables.find(item => item.id === Number(this.form.responsable_usuario_id));

    return {
      id: Number(this.form.id || 0),
      uuid: this.form.uuid || '',
      folio: this.form.folio || '',
      tercero_id: Number(this.form.tercero_id),
      tercero_nombre: cliente?.nombre_completo || this.form.tercero_nombre || '',
      tercero_rut: cliente ? `${cliente.ruc || ''}${cliente.dv ? `-${cliente.dv}` : ''}` : this.form.tercero_rut || '',
      fallecido_nombre: this.form.fallecido_nombre || '',
      fallecido_rut: this.form.fallecido_rut || '',
      motivo_fallecimiento_id: Number(this.form.motivo_fallecimiento_id || 0),
      suscripcion_plan_id: Number(this.form.suscripcion_plan_id),
      plan_nombre: plan?.nombre || this.form.plan_nombre || '',
      estado: this.form.estado || 'pendiente',
      sucursal_id: Number(this.form.sucursal_id),
      sucursal_nombre: sucursal?.nombre || this.form.sucursal_nombre || '',
      responsable_usuario_id: Number(this.form.responsable_usuario_id || 0),
      responsable_nombre: responsable?.nombre || this.form.responsable_nombre || '',
      fecha_ingreso: this.form.fecha_ingreso || '',
      monto_total: Number(this.form.monto_total || 0),
      monto_pagado: Number(this.form.monto_pagado || 0),
      fecha_velatorio: this.form.fecha_velatorio || undefined,
      fecha_ceremonia: this.form.fecha_ceremonia || undefined,
      destino: this.form.destino || undefined,
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
      this.backendAvailable = true;
      this.persistLocalServicios();
    } catch (err: any) {
      this.backendAvailable = false;
      this.cases = this.loadLocalServicios();
      this.error = 'El backend aun no expone el CRUD de servicios funerarios. Los cambios se guardaran localmente en este navegador.';
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

    const [clientes, planes, sucursales, motivos, usuarios] = await Promise.all([
      safeGet('/api/clientes'),
      safeGet('/api/planes'),
      safeGet('/api/sucursales'),
      safeGet('/api/motivos-fallecimiento'),
      safeGet('/api/usuarios')
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

    this.form = this.createEmptyForm();
  }

  private toApiPayload(item: ServicioView) {
    const cliente = this.clientes.find(row => row.id === item.tercero_id);
    const plan = this.planes.find(row => row.id === item.suscripcion_plan_id);
    const sucursal = this.sucursales.find(row => row.id === item.sucursal_id);
    const motivo = this.motivos.find(row => row.id === item.motivo_fallecimiento_id);
    const responsable = this.responsables.find(row => row.id === item.responsable_usuario_id);

    return {
      folio: item.folio,
      fallecidoNombre: item.fallecido_nombre,
      fallecidoRut: item.fallecido_rut,
      estado: item.estado,
      fechaIngreso: item.fecha_ingreso,
      fechaVelatorio: item.fecha_velatorio || null,
      fechaCeremonia: item.fecha_ceremonia || null,
      destino: item.destino || null,
      montoTotal: item.monto_total,
      montoPagado: item.monto_pagado,
      activo: item.activo ? 1 : 0,
      terceroUuid: cliente?.uuid || item.tercero_uuid,
      suscripcionPlanUuid: plan?.uuid || item.plan_uuid,
      sucursalUuid: sucursal?.uuid || item.sucursal_uuid,
      motivoFallecimientoUuid: motivo?.uuid || item.motivo_uuid,
      responsableUsuarioUuid: responsable?.uuid || item.responsable_uuid
    };
  }

  private fromApiServicio(item: any, index: number): ServicioView {
    const terceroUuid = item.terceroUuid ?? item.tercero_uuid ?? item.tercero?.uuid;
    const planUuid = item.suscripcionPlanUuid ?? item.planUuid ?? item.suscripcion_plan_uuid ?? item.plan?.uuid;
    const sucursalUuid = item.sucursalUuid ?? item.sucursal_uuid ?? item.sucursal?.uuid;
    const motivoUuid = item.motivoFallecimientoUuid ?? item.motivo_fallecimiento_uuid ?? item.motivoFallecimiento?.uuid;
    const responsableUuid = item.responsableUsuarioUuid ?? item.responsable_usuario_uuid ?? item.responsableUsuario?.uuid;
    const cliente = this.clientes.find(row => row.uuid === terceroUuid);
    const plan = this.planes.find(row => row.uuid === planUuid);
    const sucursal = this.sucursales.find(row => row.uuid === sucursalUuid);
    const motivo = this.motivos.find(row => row.uuid === motivoUuid);
    const responsable = this.responsables.find(row => row.uuid === responsableUuid);
    const estado = String(item.estado ?? 'pendiente').toLowerCase().replace(' ', '_') as Servicio['estado'];

    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      folio: item.folio ?? '',
      tercero_id: cliente?.id || Number(item.tercero_id ?? item.terceroId ?? 0),
      tercero_nombre: item.terceroNombre ?? item.tercero_nombre ?? item.tercero?.nombreCompleto ?? cliente?.nombre_completo ?? '',
      tercero_rut: String(item.terceroRut ?? item.tercero_rut ?? item.tercero?.rut ?? cliente?.ruc ?? ''),
      fallecido_nombre: item.fallecidoNombre ?? item.fallecido_nombre ?? '',
      fallecido_rut: String(item.fallecidoRut ?? item.fallecido_rut ?? ''),
      motivo_fallecimiento_id: motivo?.id || Number(item.motivo_fallecimiento_id ?? item.motivoFallecimientoId ?? 0),
      suscripcion_plan_id: plan?.id || Number(item.suscripcion_plan_id ?? item.suscripcionPlanId ?? 0),
      plan_nombre: item.planNombre ?? item.plan_nombre ?? item.suscripcionPlan?.nombre ?? plan?.nombre ?? '',
      estado: ['pendiente', 'programado', 'en_curso', 'completado'].includes(estado) ? estado : 'pendiente',
      sucursal_id: sucursal?.id || Number(item.sucursal_id ?? item.sucursalId ?? 0),
      sucursal_nombre: item.sucursalNombre ?? item.sucursal_nombre ?? item.sucursal?.nombre ?? sucursal?.nombre ?? '',
      responsable_usuario_id: responsable?.id || Number(item.responsable_usuario_id ?? item.responsableUsuarioId ?? 0),
      responsable_nombre: item.responsableNombre ?? item.responsable_nombre ?? responsable?.nombre ?? '',
      fecha_ingreso: item.fechaIngreso ?? item.fecha_ingreso ?? '',
      monto_total: Number(item.montoTotal ?? item.monto_total ?? 0),
      monto_pagado: Number(item.montoPagado ?? item.monto_pagado ?? 0),
      fecha_velatorio: item.fechaVelatorio ?? item.fecha_velatorio,
      fecha_ceremonia: item.fechaCeremonia ?? item.fecha_ceremonia,
      destino: item.destino,
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

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private loadLocalServicios(): ServicioView[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.warn('No se pudieron recuperar los servicios locales', error);
    }
    return SERVICIOS.map(item => ({ ...item, activo: true })) as ServicioView[];
  }

  private saveLocalServicio(item: ServicioView) {
    if (this.isEditing && this.selectedCase) {
      const index = this.cases.findIndex(row => row.uuid === this.selectedCase?.uuid);
      if (index >= 0) this.cases[index] = { ...this.selectedCase, ...item };
    } else {
      const nextId = this.cases.length ? Math.max(...this.cases.map(row => row.id)) + 1 : 1;
      this.cases = [...this.cases, { ...item, id: nextId, uuid: crypto.randomUUID(), activo: true }];
    }
    this.persistLocalServicios();
  }

  private persistLocalServicios() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cases));
    } catch (error) {
      console.warn('No se pudieron guardar los servicios localmente', error);
    }
  }

  private clearMessages() {
    this.error = null;
    this.success = null;
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 0) return 'No se pudo conectar con el servidor. Verifica que el BFF esté disponible.';
    return err?.error?.message || err?.error?.payload?.message || err?.message || fallback;
  }
}
