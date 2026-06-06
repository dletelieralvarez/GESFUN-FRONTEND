import { Component } from '@angular/core';
import { CLP, PRODUCTOS_SERVICIOS, SALAS, SUSCRIPCION_PLANS } from '../../data/mock-data';
import { SuscripcionPlan } from '../../data/models';

interface PlanKitItem {
  producto_servicio_id: number;
  codigo: string;
  nombre: string;
  tipo_item: string;
  cantidad: number;
  unitario: number;
  total: number;
  observacion?: string;
}

type PlanConKit = SuscripcionPlan & { kit: PlanKitItem[] };

@Component({
  selector: 'app-planes',
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.css']
})
export class PlanesComponent {
  productosServicios = PRODUCTOS_SERVICIOS;
  planes: PlanConKit[] = SUSCRIPCION_PLANS.map((plan, index) => {
    const kit = this.createDefaultKit(index);
    return {
      ...plan,
      valor: kit.reduce((sum, item) => sum + item.total, 0) || plan.valor,
      sucursal_id: index + 1,
      kit
    };
  });
  sucursales = SALAS.map((nombre, index) => ({ id: index + 1, nombre }));
  formVisible = false;
  isEditing = false;
  selectedPlan: PlanConKit | null = null;
  form: Partial<PlanConKit> = this.createEmptyForm();
  selectedProductoServicioId = PRODUCTOS_SERVICIOS[0]?.id || 0;
  selectedCantidad = 1;
  selectedObservacion = '';
  clp = CLP;

  get titleCount() {
    return this.planes.length;
  }

  get kitTotal() {
    return (this.form.kit || []).reduce((sum, item) => sum + item.total, 0);
  }

  trackById(index: number, plan: PlanConKit) {
    return plan.id;
  }

  trackByProductoServicio(index: number, item: PlanKitItem) {
    return item.producto_servicio_id;
  }

  openNew() {
    this.isEditing = false;
    this.selectedPlan = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(plan: PlanConKit) {
    this.isEditing = true;
    this.selectedPlan = plan;
    this.form = { ...plan, kit: plan.kit.map(item => ({ ...item })) };
    this.formVisible = true;
  }

  delete(plan: PlanConKit) {
    if (!confirm(`Eliminar plan ${plan.nombre}?`)) {
      return;
    }
    this.planes = this.planes.filter(row => row.id !== plan.id);
    if (this.selectedPlan?.id === plan.id) {
      this.cancel();
    }
  }

  save() {
    if (!this.form.nombre || !this.form.descripcion || !this.form.sucursal_id || !this.form.kit?.length) {
      alert('Completa nombre, descripcion, sucursal y agrega al menos un producto o servicio.');
      return;
    }

    const result = this.getFullPlanFromForm();
    if (this.isEditing && this.selectedPlan) {
      this.planes = this.planes.map(plan => plan.id === this.selectedPlan!.id ? { ...plan, ...result } : plan);
    } else {
      const nextId = Math.max(0, ...this.planes.map(plan => plan.id)) + 1;
      this.planes = [...this.planes, { ...result, id: nextId, uuid: `uuid-plan-${Date.now()}` }];
    }

    this.cancel();
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedPlan = null;
    this.form = this.createEmptyForm();
    this.selectedCantidad = 1;
    this.selectedObservacion = '';
  }

  getSucursalName(id?: number) {
    return this.sucursales.find(sucursal => sucursal.id === Number(id))?.nombre || '';
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
          codigo: productoServicio.codigo,
          nombre: productoServicio.nombre,
          tipo_item: productoServicio.tipo_item,
          cantidad,
          unitario: productoServicio.precio,
          total: productoServicio.precio * cantidad,
          observacion: this.selectedObservacion
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
      sucursal_id: 1,
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
      kit: (this.form.kit || []).map(item => ({ ...item }))
    } as PlanConKit;
  }

  private createDefaultKit(index: number): PlanKitItem[] {
    const defaults = [
      [2, 5],
      [2, 3, 5],
      [2, 3, 5, 6]
    ][index] || [];

    return defaults
      .map(id => this.productoToKitItem(id, 1))
      .filter((item): item is PlanKitItem => !!item);
  }

  private productoToKitItem(productoServicioId: number, cantidad: number): PlanKitItem | null {
    const productoServicio = PRODUCTOS_SERVICIOS.find(item => item.id === productoServicioId);
    if (!productoServicio) {
      return null;
    }

    return {
      producto_servicio_id: productoServicio.id,
      codigo: productoServicio.codigo,
      nombre: productoServicio.nombre,
      tipo_item: productoServicio.tipo_item,
      cantidad,
      unitario: productoServicio.precio,
      total: productoServicio.precio * cantidad
    };
  }
}
