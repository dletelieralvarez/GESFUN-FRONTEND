import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { CLP } from '../../data/ui-data';
import { ProductoServicio, Sucursal, SuscripcionPlan } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';

interface PlanKitItem {
  id?: number;
  uuid?: string;
  producto_servicio_id: number;
  producto_servicio_uuid?: string;
  codigo: string;
  nombre: string;
  tipo_item: string;
  cantidad: number;
  unitario: number;
  total: number;
  observacion?: string;
  activo?: boolean;
}

type PlanConKit = SuscripcionPlan & { kit: PlanKitItem[] };

@Component({
  selector: 'app-planes',
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.css']
})
export class PlanesComponent implements OnInit, OnDestroy {
  productosServicios: ProductoServicio[] = [];
  planes: PlanConKit[] = [];
  sucursales: Sucursal[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedPlan: PlanConKit | null = null;
  planPendingDeactivate: PlanConKit | null = null;
  form: Partial<PlanConKit> = this.createEmptyForm();
  selectedProductoServicioId = 0;
  selectedCantidad = 1;
  selectedObservacion = '';
  clp = CLP;
  private successMessageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
    await this.loadPlanes();
  }

  ngOnDestroy() {
    this.clearSuccessMessageTimeout();
  }

  get titleCount() {
    return this.planes.length;
  }

  get kitTotal() {
    return (this.form.kit || []).reduce((sum, item) => sum + item.total, 0);
  }

  trackById(index: number, plan: PlanConKit) {
    return plan.uuid || plan.id;
  }

  trackByProductoServicio(index: number, item: PlanKitItem) {
    return item.uuid || item.producto_servicio_uuid || item.producto_servicio_id;
  }

  openNew() {
    this.clearMessages();
    this.planPendingDeactivate = null;
    this.isEditing = false;
    this.selectedPlan = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(plan: PlanConKit) {
    this.clearMessages();
    this.planPendingDeactivate = null;
    if (!this.isPlanActivo(plan)) {
      this.error = 'No se puede editar un plan desactivado.';
      return;
    }
    this.isEditing = true;
    this.selectedPlan = plan;
    this.form = { ...plan, kit: plan.kit.map(item => ({ ...item })) };
    this.formVisible = true;
  }

  delete(plan: PlanConKit) {
    if (!this.isPlanActivo(plan)) {
      this.error = 'El plan ya esta desactivado.';
      return;
    }

    this.formVisible = false;
    this.isEditing = false;
    this.selectedPlan = null;
    this.planPendingDeactivate = plan;
    this.clearMessages();
  }

  async confirmDeactivatePlan() {
    if (!this.planPendingDeactivate) {
      return;
    }

    const plan = this.planPendingDeactivate;
    this.loading = true;
    this.clearMessages();

    try {
      await this.patchPlanDesactivar(plan);
      await this.loadPlanes();
      this.showSuccess('Plan desactivado correctamente.');
      this.planPendingDeactivate = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo desactivar el plan.');
    } finally {
      this.loading = false;
    }
  }

  cancelDeactivate() {
    this.planPendingDeactivate = null;
  }

  async save() {
    this.clearMessages();

    if (!this.form.nombre || !this.form.descripcion || !this.form.sucursal_id || !this.form.kit?.length) {
      this.error = 'Completa nombre, descripcion, sucursal y agrega al menos un producto o servicio.';
      return;
    }

    this.saving = true;
    const result = this.getFullPlanFromForm();

    try {
      if (this.isEditing && this.selectedPlan) {
        const updated = { ...this.selectedPlan, ...result };
        await this.putPlan(updated);
        await this.syncPlanKit(this.selectedPlan.uuid, result.kit, this.selectedPlan.kit);
        await this.loadPlanes();
        this.showSuccess('Plan actualizado correctamente.');
      } else {
        const created = await this.postPlan(result);
        const planUuid = this.extractCreatedUuid(created);
        if (planUuid) {
          await this.syncPlanKit(planUuid, result.kit, []);
        }
        await this.loadPlanes();
        this.showSuccess('Plan creado correctamente.');
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el plan.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.error = null;
    this.formVisible = false;
    this.isEditing = false;
    this.selectedPlan = null;
    this.planPendingDeactivate = null;
    this.form = this.createEmptyForm();
    this.selectedCantidad = 1;
    this.selectedObservacion = '';
  }

  getSucursalName(id?: number) {
    return this.sucursales.find(sucursal => sucursal.id === Number(id))?.nombre || '';
  }

  isPlanActivo(plan: PlanConKit) {
    return plan.activo !== false;
  }

  dismissError() {
    this.error = null;
  }

  dismissSuccess() {
    this.success = null;
    this.clearSuccessMessageTimeout();
  }

  addKitItem() {
    const productoServicio = this.productosServicios.find(item => item.id === Number(this.selectedProductoServicioId));
    if (!productoServicio) {
      return;
    }

    const cantidad = Math.max(1, Number(this.selectedCantidad || 1));
    const existing = (this.form.kit || []).find(item => item.producto_servicio_id === productoServicio.id);

    if (existing) {
      existing.cantidad += cantidad;
      existing.total = existing.cantidad * existing.unitario;
      existing.observacion = this.selectedObservacion || existing.observacion;
    } else {
      this.form.kit = [
        ...this.form.kit || [],
        {
          producto_servicio_id: productoServicio.id,
          producto_servicio_uuid: productoServicio.uuid,
          codigo: productoServicio.codigo,
          nombre: productoServicio.nombre,
          tipo_item: productoServicio.tipo_item,
          cantidad,
          unitario: productoServicio.precio,
          total: productoServicio.precio * cantidad,
          observacion: this.selectedObservacion,
          activo: true
        }
      ];
    }

    this.form.valor = this.kitTotal;
    this.selectedCantidad = 1;
    this.selectedObservacion = '';
  }

  updateKitItem(item: PlanKitItem) {
    item.cantidad = Math.max(1, Number(item.cantidad || 1));
    item.total = item.cantidad * item.unitario;
    this.form.valor = this.kitTotal;
  }

  removeKitItem(productoServicioId: number) {
    this.form.kit = (this.form.kit || []).filter(item => item.producto_servicio_id !== productoServicioId);
    this.form.valor = this.kitTotal;
  }

  private createEmptyForm(): Partial<PlanConKit> {
    return {
      nombre: '',
      descripcion: '',
      valor: 0,
      activo: true,
      sucursal_id: this.sucursales[0]?.id || 1,
      kit: []
    };
  }

  private getFullPlanFromForm(): PlanConKit {
    return {
      ...this.form,
      nombre: this.form.nombre || '',
      descripcion: this.form.descripcion || '',
      valor: this.kitTotal,
      activo: this.form.activo !== false,
      sucursal_id: Number(this.form.sucursal_id || 1),
      kit: (this.form.kit || []).map(item => ({ ...item, activo: item.activo !== false }))
    } as PlanConKit;
  }

  private async loadCatalogos() {
    try {
      const token = await this.auth.getAccessToken();
      const [sucursalesResponse, productosResponse] = await Promise.all([
        lastValueFrom(this.http.get(`${bffApiUrl}/api/sucursales`, { headers: { Authorization: `Bearer ${token}` } })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/productos-servicios`, { headers: { Authorization: `Bearer ${token}` } }))
      ]);

      const sucursales = this.extractPayload<any>(sucursalesResponse);
      const productos = this.extractPayload<any>(productosResponse);

      if (sucursales.length) {
        this.sucursales = sucursales.map((sucursal, index) => this.fromApiSucursal(sucursal, index));
        this.form.sucursal_id = this.sucursales[0].id;
      }

      if (productos.length) {
        this.productosServicios = productos.map((item, index) => this.fromApiProductoServicio(item, index));
        this.selectedProductoServicioId = this.productosServicios[0]?.id || 0;
      }
    } catch (error) {
      console.warn('No se pudieron cargar sucursales/productos desde el BFF', error);
    }
  }

  private async loadPlanes() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/planes`, {
        headers: { Authorization: `Bearer ${token}` }
      }));

      const planes = this.extractPayload<any>(response).map((plan, index) => this.fromApiPlan(plan, index));
      this.planes = await Promise.all(planes.map(plan => this.attachKit(plan)));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los planes.');
    } finally {
      this.loading = false;
    }
  }

  private async attachKit(plan: PlanConKit): Promise<PlanConKit> {
    if (!plan.uuid) {
      return plan;
    }

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/plan-kit/plan/${plan.uuid}`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      const kit = this.extractPayload<any>(response).map((item, index) => this.fromApiPlanKit(item, index));
      return {
        ...plan,
        kit,
        valor: kit.reduce((sum, item) => sum + item.total, 0)
      };
    } catch (error) {
      console.warn(`No se pudo cargar kit para plan ${plan.uuid}`, error);
      return plan;
    }
  }

  private async postPlan(plan: PlanConKit) {
    const token = await this.auth.getAccessToken();
    return lastValueFrom(this.http.post(`${bffApiUrl}/api/planes`, this.toPlanPayload(plan), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async putPlan(plan: PlanConKit) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/planes/${plan.uuid}`, this.toPlanPayload(plan), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async patchPlanDesactivar(plan: PlanConKit) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.patch(`${bffApiUrl}/api/planes/${plan.uuid}/desactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async syncPlanKit(planUuid: string | undefined, nextKit: PlanKitItem[], previousKit: PlanKitItem[]) {
    if (!planUuid) {
      return;
    }

    const token = await this.auth.getAccessToken();
    const nextByUuid = nextKit.filter(item => item.uuid);
    const nextUuids = new Set(nextByUuid.map(item => item.uuid));
    const removed = previousKit.filter(item => item.uuid && !nextUuids.has(item.uuid));

    await Promise.all(removed.map(item => lastValueFrom(this.http.delete(`${bffApiUrl}/api/plan-kit/${item.uuid}`, {
      headers: { Authorization: `Bearer ${token}` }
    }))));

    for (const item of nextKit) {
      const payload = this.toPlanKitPayload(planUuid, item);
      if (item.uuid) {
        await lastValueFrom(this.http.put(`${bffApiUrl}/api/plan-kit/${item.uuid}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        }));
      } else {
        await lastValueFrom(this.http.post(`${bffApiUrl}/api/plan-kit`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        }));
      }
    }
  }

  private toPlanPayload(plan: PlanConKit) {
    const sucursal = this.sucursales.find(item => item.id === Number(plan.sucursal_id)) ?? this.sucursales[0];
    return {
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      activo: plan.activo !== false ? 1 : 0,
      sucursalUuid: sucursal?.uuid
    };
  }

  private toPlanKitPayload(planUuid: string, item: PlanKitItem) {
    const productoServicio = this.productosServicios.find(row => row.id === Number(item.producto_servicio_id));
    return {
      cantidad: Number(item.cantidad || 1),
      unitario: Number(item.unitario || 0),
      observacion: item.observacion || undefined,
      activo: item.activo !== false ? 1 : 0,
      productoServicioUuid: item.producto_servicio_uuid || productoServicio?.uuid,
      planUuid
    };
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private extractCreatedUuid(response: any) {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return payload?.uuid;
  }

  private fromApiPlan(item: any, index: number): PlanConKit {
    const sucursalUuid = item.sucursalUuid ?? item.sucursal_uuid ?? item.sucursal?.uuid;
    const sucursal = this.sucursales.find(row => row.uuid === sucursalUuid);
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      valor: Number(item.valor ?? 0),
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      sucursal_id: sucursal?.id || Number(item.sucursal_id ?? this.sucursales[0]?.id ?? 1),
      kit: []
    };
  }

  private fromApiPlanKit(item: any, index: number): PlanKitItem {
    const productoServicioUuid = item.productoServicioUuid ?? item.producto_servicio_uuid ?? item.productoServicio?.uuid;
    const productoServicio = this.productosServicios.find(row => row.uuid === productoServicioUuid);
    const cantidad = Number(item.cantidad ?? 1);
    const unitario = Number(item.unitario ?? productoServicio?.precio ?? 0);
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      producto_servicio_id: productoServicio?.id || Number(item.producto_servicio_id ?? index + 1),
      producto_servicio_uuid: productoServicioUuid,
      codigo: productoServicio?.codigo || item.productoServicio?.codigo || '',
      nombre: productoServicio?.nombre || item.productoServicio?.nombre || 'Item del plan',
      tipo_item: productoServicio?.tipo_item || item.productoServicio?.tipoItem || '',
      cantidad,
      unitario,
      total: cantidad * unitario,
      observacion: item.observacion,
      activo: item.activo === undefined || item.activo === true || item.activo === 1
    };
  }

  private fromApiSucursal(item: any, index: number): Sucursal {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: item.codigo ?? `SUC-${index + 1}`,
      nombre: item.nombre ?? `Sucursal ${index + 1}`,
      direccion: item.direccion ?? '',
      telefono: item.telefono ?? '',
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      empresa_id: Number(item.empresa_id ?? item.empresaId ?? 1),
      comuna_id: Number(item.comuna_id ?? item.comunaId ?? 1)
    };
  }

  private fromApiProductoServicio(item: any, index: number): ProductoServicio {
    const tipoItem = item.tipoItem ?? item.tipo_item;
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      tipo_item: tipoItem === 'S' || tipoItem === 'servicio' ? 'servicio' : 'producto',
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      precio: Number(item.precio ?? 0),
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      afecto: item.afecto === undefined || item.afecto === true || item.afecto === 1,
      unidad_medida_id: Number(item.unidad_medida_id ?? 1),
      empresa_id: Number(item.empresa_id ?? 1),
      categoria: item.categoria ?? 'General'
    };
  }

  private clearMessages() {
    this.error = null;
    this.success = null;
    this.clearSuccessMessageTimeout();
  }

  private showSuccess(message: string) {
    this.success = message;
    this.clearSuccessMessageTimeout();
    this.successMessageTimeout = setTimeout(() => {
      this.success = null;
      this.successMessageTimeout = null;
    }, 4000);
  }

  private clearSuccessMessageTimeout() {
    if (this.successMessageTimeout) {
      clearTimeout(this.successMessageTimeout);
      this.successMessageTimeout = null;
    }
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el BFF esté disponible.';
    }
    return this.sanitizeBackendMessage(err?.error?.message || err?.message || fallback);
  }

  private sanitizeBackendMessage(message: string) {
    const text = String(message || '').trim();
    const jsonStart = text.indexOf('{');

    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(text.slice(jsonStart));
        return parsed?.message || text.slice(0, jsonStart).trim() || text;
      } catch {
        return text.slice(0, jsonStart).trim() || text;
      }
    }

    return text;
  }
}
