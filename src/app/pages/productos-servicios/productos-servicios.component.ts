import { Component } from '@angular/core';
import { CLP, PRODUCTOS_SERVICIOS } from '../../data/mock-data';
import { ProductoServicio } from '../../data/models';

type ProductoServicioForm = ProductoServicio & { categoria: string };

@Component({
  selector: 'app-productos-servicios',
  templateUrl: './productos-servicios.component.html',
  styleUrls: ['./productos-servicios.component.css']
})
export class ProductosServiciosComponent {
  items: ProductoServicioForm[] = PRODUCTOS_SERVICIOS.map(item => ({ ...item })) as ProductoServicioForm[];
  formVisible = false;
  isEditing = false;
  selectedItem: ProductoServicioForm | null = null;
  form: Partial<ProductoServicioForm> = this.createEmptyForm();
  clp = CLP;

  get titleCount() {
    return this.items.length;
  }

  trackById(index: number, item: ProductoServicioForm) {
    return item.id;
  }

  openNew() {
    this.isEditing = false;
    this.selectedItem = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(item: ProductoServicioForm) {
    this.isEditing = true;
    this.selectedItem = item;
    this.form = { ...item };
    this.formVisible = true;
  }

  delete(item: ProductoServicioForm) {
    if (!confirm(`Eliminar ${item.nombre}?`)) {
      return;
    }
    this.items = this.items.filter(row => row.id !== item.id);
    if (this.selectedItem?.id === item.id) {
      this.cancel();
    }
  }

  save() {
    if (!this.form.codigo || !this.form.nombre || !this.form.descripcion || !this.form.precio) {
      alert('Completa código, nombre, descripción y precio.');
      return;
    }

    const result = this.getFullItemFromForm();
    if (this.isEditing && this.selectedItem) {
      this.items = this.items.map(item => item.id === this.selectedItem!.id ? { ...item, ...result } : item);
    } else {
      const nextId = Math.max(0, ...this.items.map(item => item.id)) + 1;
      this.items = [...this.items, { ...result, id: nextId, uuid: `uuid-ps-${Date.now()}` }];
    }

    this.cancel();
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedItem = null;
    this.form = this.createEmptyForm();
  }

  private createEmptyForm(): Partial<ProductoServicioForm> {
    return {
      tipo_item: 'producto',
      codigo: '',
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: 'Insumos',
      activo: true,
      afecto: true,
      unidad_medida_id: 1,
      empresa_id: 1
    };
  }

  private getFullItemFromForm(): ProductoServicioForm {
    return {
      ...this.form,
      tipo_item: this.form.tipo_item || 'producto',
      precio: Number(this.form.precio || 0),
      activo: this.form.activo !== false,
      afecto: this.form.afecto !== false,
      unidad_medida_id: Number(this.form.unidad_medida_id || 1),
      empresa_id: Number(this.form.empresa_id || 1),
      categoria: this.form.categoria || 'General'
    } as ProductoServicioForm;
  }
}
