import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { CLP, PRODUCTOS_SERVICIOS } from '../../data/mock-data';
import { ProductoServicio } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';

type ProductoServicioForm = ProductoServicio & { categoria: string };

@Component({
  selector: 'app-productos-servicios',
  templateUrl: './productos-servicios.component.html',
  styleUrls: ['./productos-servicios.component.css']
})
export class ProductosServiciosComponent implements OnInit {
  items: ProductoServicioForm[] = PRODUCTOS_SERVICIOS.map(item => ({ ...item })) as ProductoServicioForm[];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedItem: ProductoServicioForm | null = null;
  form: Partial<ProductoServicioForm> = this.createEmptyForm();
  clp = CLP;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.loadProductosServicios();
  }

  get titleCount() {
    return this.items.length;
  }

  trackById(index: number, item: ProductoServicioForm) {
    return item.id;
  }

  openNew() {
    this.clearMessages();
    this.isEditing = false;
    this.selectedItem = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(item: ProductoServicioForm) {
    this.clearMessages();
    this.isEditing = true;
    this.selectedItem = item;
    this.form = { ...item };
    this.formVisible = true;
  }

  async delete(item: ProductoServicioForm) {
    if (!confirm(`Eliminar ${item.nombre}?`)) {
      return;
    }

    this.loading = true;
    this.clearMessages();

    try {
      await this.patchProductoServicioDesactivar(item);
      this.items = this.items.filter(row => row.id !== item.id);
      this.success = 'Producto o servicio eliminado correctamente.';
      if (this.selectedItem?.id === item.id) {
        this.cancel();
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo eliminar el producto o servicio.');
    } finally {
      this.loading = false;
    }
  }

  async save() {
    this.clearMessages();

    if (!this.form.codigo || !this.form.nombre || !this.form.descripcion || !this.form.precio) {
      this.error = 'Completa codigo, nombre, descripcion y precio.';
      return;
    }

    this.saving = true;
    const result = this.getFullItemFromForm();

    try {
      if (this.isEditing && this.selectedItem) {
        const updated = { ...this.selectedItem, ...result };
        await this.putProductoServicio(updated);
        await this.loadProductosServicios();
        this.success = 'Producto o servicio actualizado correctamente.';
      } else {
        await this.postProductoServicio(result);
        await this.loadProductosServicios();
        this.success = 'Producto o servicio creado correctamente.';
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el producto o servicio.');
    } finally {
      this.saving = false;
    }
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

  private async postProductoServicio(item: ProductoServicioForm) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.post(`${bffApiUrl}/api/productos-servicios`, this.toApiPayload(item), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async loadProductosServicios() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/productos-servicios`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.items = this.extractPayload<ProductoServicioForm>(response);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los productos y servicios.');
    } finally {
      this.loading = false;
    }
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private async putProductoServicio(item: ProductoServicioForm) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/productos-servicios/${item.uuid}`, this.toApiPayload(item), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async patchProductoServicioDesactivar(item: ProductoServicioForm) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.patch(`${bffApiUrl}/api/productos-servicios/${item.uuid}/desactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private toApiPayload(item: ProductoServicioForm) {
    return {
      ...item,
      precio: Number(item.precio || 0),
      activo: item.activo !== false ? 1 : 0,
      afecto: item.afecto !== false ? 1 : 0,
      unidad_medida_id: Number(item.unidad_medida_id || 1),
      empresa_id: Number(item.empresa_id || 1)
    };
  }

  private clearMessages() {
    this.error = null;
    this.success = null;
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 0) {
      return 'No se pudo conectar con el BFF. Verifica que el servicio este levantado en http://localhost:8081.';
    }
    return err?.error?.message || err?.message || fallback;
  }
}
