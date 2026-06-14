import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { CLP, PRODUCTOS_SERVICIOS } from '../../data/mock-data';
import { Empresa, ProductoServicio, UnidadMedida } from '../../data/models';
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
  unidadesMedida: UnidadMedida[] = [];
  empresas: Empresa[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedItem: ProductoServicioForm | null = null;
  itemPendingDeactivate: ProductoServicioForm | null = null;
  form: Partial<ProductoServicioForm> = this.createEmptyForm();
  clp = CLP;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
    await this.loadProductosServicios();
  }

  get titleCount() {
    return this.items.length;
  }

  trackById(index: number, item: ProductoServicioForm) {
    return item.uuid || item.id;
  }

  openNew() {
    this.clearMessages();
    this.itemPendingDeactivate = null;
    this.isEditing = false;
    this.selectedItem = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(item: ProductoServicioForm) {
    this.clearMessages();
    this.itemPendingDeactivate = null;
    if (!this.isItemActivo(item)) {
      this.error = 'No se puede editar un producto o servicio desactivado.';
      return;
    }
    this.isEditing = true;
    this.selectedItem = item;
    this.form = { ...item };
    this.formVisible = true;
  }

  delete(item: ProductoServicioForm) {
    if (!this.isItemActivo(item)) {
      this.error = 'El producto o servicio ya esta desactivado.';
      return;
    }

    this.formVisible = false;
    this.isEditing = false;
    this.selectedItem = null;
    this.itemPendingDeactivate = item;
    this.clearMessages();
  }

  async confirmDeactivateItem() {
    if (!this.itemPendingDeactivate) {
      return;
    }

    const item = this.itemPendingDeactivate;
    this.loading = true;
    this.clearMessages();

    try {
      await this.patchProductoServicioDesactivar(item);
      await this.loadProductosServicios();
      this.success = 'Producto o servicio desactivado correctamente.';
      if (this.selectedItem?.uuid === item.uuid) {
        this.cancel();
      }
      this.itemPendingDeactivate = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo desactivar el producto o servicio.');
    } finally {
      this.loading = false;
    }
  }

  cancelDeactivate() {
    this.itemPendingDeactivate = null;
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
    this.itemPendingDeactivate = null;
    this.form = this.createEmptyForm();
  }

  isItemActivo(item: ProductoServicioForm) {
    return item.activo !== false;
  }

  getUnidadMedidaNombre(id?: number) {
    return this.unidadesMedida.find(unidad => unidad.id === Number(id))?.nombre || '';
  }

  getEmpresaNombre(id?: number) {
    return this.empresas.find(empresa => empresa.id === Number(id))?.razon_social || '';
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
      unidad_medida_id: this.unidadesMedida[0]?.id || 1,
      empresa_id: this.empresas[0]?.id || 1
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
      this.items = this.extractPayload<any>(response).map((item, index) => this.fromApiProductoServicio(item, index));
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

  private async loadCatalogos() {
    try {
      const token = await this.auth.getAccessToken();
      const [unidadesResponse, empresasResponse] = await Promise.all([
        lastValueFrom(this.http.get(`${bffApiUrl}/api/unidades-medida`, { headers: { Authorization: `Bearer ${token}` } })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/empresas`, { headers: { Authorization: `Bearer ${token}` } }))
      ]);

      const unidades = this.extractPayload<any>(unidadesResponse);
      const empresas = this.extractPayload<any>(empresasResponse);

      if (unidades.length) {
        this.unidadesMedida = unidades.map((unidad, index) => this.fromApiUnidadMedida(unidad, index));
        this.form.unidad_medida_id = this.unidadesMedida[0].id;
      }

      if (empresas.length) {
        this.empresas = empresas.map((empresa, index) => this.fromApiEmpresa(empresa, index));
        this.form.empresa_id = this.empresas[0].id;
      }
    } catch (error) {
      console.warn('No se pudieron cargar unidades de medida/empresas desde el BFF', error);
    }
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
    const unidadMedida = this.unidadesMedida.find(unidad => unidad.id === Number(item.unidad_medida_id)) ?? this.unidadesMedida[0];
    const empresa = this.empresas.find(row => row.id === Number(item.empresa_id)) ?? this.empresas[0];

    return {
      tipoItem: item.tipo_item === 'servicio' ? 'S' : 'P',
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: Number(item.precio || 0),
      activo: item.activo !== false ? 1 : 0,
      afecto: item.afecto !== false ? 1 : 0,
      unidadMedidaUuid: unidadMedida?.uuid,
      empresaUuid: empresa?.uuid
    };
  }

  private fromApiProductoServicio(item: any, index: number): ProductoServicioForm {
    const tipoItem = item.tipoItem ?? item.tipo_item;
    const unidadMedidaUuid = item.unidadMedidaUuid ?? item.unidad_medida_uuid ?? item.unidadMedida?.uuid;
    const empresaUuid = item.empresaUuid ?? item.empresa_uuid ?? item.empresa?.uuid;
    const unidadMedida = this.unidadesMedida.find(unidad => unidad.uuid === unidadMedidaUuid);
    const empresa = this.empresas.find(row => row.uuid === empresaUuid);

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
      unidad_medida_id: unidadMedida?.id || Number(item.unidad_medida_id ?? this.unidadesMedida[0]?.id ?? 1),
      empresa_id: empresa?.id || Number(item.empresa_id ?? this.empresas[0]?.id ?? 1),
      categoria: item.categoria ?? this.inferCategoria(item.nombre ?? item.descripcion ?? '')
    };
  }

  private fromApiUnidadMedida(item: any, index: number): UnidadMedida {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: String(item.codigo ?? item.code ?? index + 1),
      nombre: item.nombre ?? `Unidad ${index + 1}`,
      activo: item.activo === undefined || item.activo === true || item.activo === 1
    };
  }

  private fromApiEmpresa(item: any, index: number): Empresa {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      rut: String(item.rut ?? ''),
      dv: item.dv ?? '',
      razon_social: item.razonSocial ?? item.razon_social ?? item.nombre ?? `Empresa ${index + 1}`,
      activo: item.activo === undefined ? true : Boolean(item.activo),
      usuario_id: Number(item.usuario_id ?? item.usuarioId ?? 0),
      comuna_id: Number(item.comuna_id ?? item.comunaId ?? 1),
      direccion: item.direccion ?? ''
    };
  }

  private inferCategoria(texto: string) {
    const value = texto.toLowerCase();
    if (value.includes('ataud') || value.includes('ataud')) return 'Ataudes';
    if (value.includes('flor')) return 'Flores';
    if (value.includes('caf')) return 'Cafeteria';
    if (value.includes('cirio') || value.includes('libro')) return 'Insumos';
    return 'General';
  }

  private clearMessages() {
    this.error = null;
    this.success = null;
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el BFF esté disponible.';
    }
    return err?.error?.message || err?.message || fallback;
  }
}
