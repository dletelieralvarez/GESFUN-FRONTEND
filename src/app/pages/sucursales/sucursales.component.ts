import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { COMUNAS, REGIONES } from '../../data/mock-data';
import { Comuna, Empresa, Sucursal } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';

type SucursalView = Sucursal & {
  comuna_uuid?: string;
  empresa_uuid?: string;
  region_id?: number;
};

@Component({
  selector: 'app-sucursales',
  templateUrl: './sucursales.component.html',
  styleUrls: ['./sucursales.component.css']
})
export class SucursalesComponent implements OnInit {
  sucursales: SucursalView[] = [];
  regiones = REGIONES;
  comunas = COMUNAS;
  empresas: Empresa[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedSucursal: SucursalView | null = null;
  sucursalPendingDeactivate: SucursalView | null = null;
  form: Partial<SucursalView> = this.createEmptyForm();

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
    await this.loadSucursales();
  }

  get titleCount() {
    return this.sucursales.length;
  }

  get comunasFiltradas() {
    return this.comunas.filter(c => !this.form.region_id || c.region_id === Number(this.form.region_id));
  }

  trackById(index: number, item: SucursalView) {
    return item.uuid || item.id;
  }

  openNew() {
    this.clearMessages();
    this.sucursalPendingDeactivate = null;
    this.isEditing = false;
    this.selectedSucursal = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(sucursal: SucursalView) {
    this.clearMessages();
    this.sucursalPendingDeactivate = null;
    if (!this.isSucursalActiva(sucursal)) {
      this.error = 'No se puede editar una sucursal desactivada.';
      return;
    }

    this.isEditing = true;
    this.selectedSucursal = sucursal;
    this.form = {
      ...sucursal,
      region_id: this.getRegionIdByComuna(sucursal.comuna_id)
    };
    this.formVisible = true;
  }

  delete(sucursal: SucursalView) {
    if (!this.isSucursalActiva(sucursal)) {
      this.error = 'La sucursal ya esta desactivada.';
      return;
    }

    this.formVisible = false;
    this.isEditing = false;
    this.selectedSucursal = null;
    this.sucursalPendingDeactivate = sucursal;
    this.clearMessages();
  }

  async confirmDeactivateSucursal() {
    if (!this.sucursalPendingDeactivate) {
      return;
    }

    const sucursal = this.sucursalPendingDeactivate;
    this.loading = true;
    this.clearMessages();

    try {
      await this.patchSucursalDesactivar(sucursal);
      await this.loadSucursales();
      this.success = 'Sucursal desactivada correctamente.';
      if (this.selectedSucursal?.uuid === sucursal.uuid) {
        this.cancel();
      }
      this.sucursalPendingDeactivate = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo desactivar la sucursal.');
    } finally {
      this.loading = false;
    }
  }

  cancelDeactivate() {
    this.sucursalPendingDeactivate = null;
  }

  async save() {
    this.clearMessages();

    if (!this.form.codigo || !this.form.nombre || !this.form.direccion || !this.form.telefono) {
      this.error = 'Completa codigo, nombre, direccion y telefono.';
      return;
    }

    if (!this.form.comuna_id || !this.form.empresa_id) {
      this.error = 'Selecciona comuna y empresa.';
      return;
    }

    this.saving = true;
    const result = this.getFullSucursalFromForm();

    try {
      if (this.isEditing && this.selectedSucursal) {
        const updated = { ...this.selectedSucursal, ...result };
        await this.putSucursal(updated);
        await this.loadSucursales();
        this.success = 'Sucursal actualizada correctamente.';
      } else {
        await this.postSucursal(result);
        await this.loadSucursales();
        this.success = 'Sucursal creada correctamente.';
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar la sucursal.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedSucursal = null;
    this.sucursalPendingDeactivate = null;
    this.form = this.createEmptyForm();
  }

  onRegionChange() {
    const comunas = this.comunasFiltradas;
    if (!comunas.some(c => c.id === Number(this.form.comuna_id))) {
      this.form.comuna_id = comunas[0]?.id;
    }
  }

  isSucursalActiva(sucursal: SucursalView) {
    return sucursal.activo !== false;
  }

  getComunaName(id?: number) {
    return this.comunas.find(comuna => comuna.id === Number(id))?.nombre || '';
  }

  getRegionName(comunaId?: number) {
    const regionId = this.getRegionIdByComuna(comunaId);
    return this.regiones.find(region => region.id === Number(regionId))?.nombre || '';
  }

  getEmpresaName(id?: number) {
    return this.empresas.find(empresa => empresa.id === Number(id))?.razon_social || '';
  }

  private createEmptyForm(): Partial<SucursalView> {
    return {
      codigo: '',
      nombre: '',
      direccion: '',
      telefono: '',
      activo: true,
      region_id: this.comunas[0]?.region_id || 1,
      comuna_id: this.comunas[0]?.id || 1,
      empresa_id: this.empresas[0]?.id || 1
    };
  }

  private getFullSucursalFromForm(): SucursalView {
    return {
      ...this.form,
      id: Number(this.form.id || 0),
      uuid: this.form.uuid || '',
      codigo: this.form.codigo || '',
      nombre: this.form.nombre || '',
      direccion: this.form.direccion || '',
      telefono: this.form.telefono || '',
      activo: this.form.activo !== false,
      empresa_id: Number(this.form.empresa_id || this.empresas[0]?.id || 1),
      comuna_id: Number(this.form.comuna_id || this.comunas[0]?.id || 1),
      comuna_uuid: this.form.comuna_uuid,
      empresa_uuid: this.form.empresa_uuid
    } as SucursalView;
  }

  private async loadSucursales() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/sucursales`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.sucursales = this.extractPayload<any>(response).map((item, index) => this.fromApiSucursal(item, index));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar las sucursales.');
    } finally {
      this.loading = false;
    }
  }

  private async loadCatalogos() {
    try {
      const token = await this.auth.getAccessToken();
      const [comunasResponse, empresasResponse] = await Promise.all([
        lastValueFrom(this.http.get(`${bffApiUrl}/api/comunas`, { headers: { Authorization: `Bearer ${token}` } })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/empresas`, { headers: { Authorization: `Bearer ${token}` } }))
      ]);

      const comunas = this.extractPayload<any>(comunasResponse);
      const empresas = this.extractPayload<any>(empresasResponse);

      if (comunas.length) {
        this.comunas = comunas.map((comuna, index) => this.fromApiComuna(comuna, index));
        this.form.comuna_id = this.comunas[0].id;
        this.form.region_id = this.comunas[0].region_id;
      }

      if (empresas.length) {
        this.empresas = empresas.map((empresa, index) => this.fromApiEmpresa(empresa, index));
        this.form.empresa_id = this.empresas[0].id;
      }
    } catch (error) {
      console.warn('No se pudieron cargar comunas/empresas desde el BFF', error);
    }
  }

  private async postSucursal(sucursal: SucursalView) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.post(`${bffApiUrl}/api/sucursales`, this.toApiPayload(sucursal), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async putSucursal(sucursal: SucursalView) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/sucursales/${sucursal.uuid}`, this.toApiPayload(sucursal), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async patchSucursalDesactivar(sucursal: SucursalView) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.patch(`${bffApiUrl}/api/sucursales/${sucursal.uuid}/desactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private toApiPayload(sucursal: SucursalView) {
    const comuna = this.comunas.find(item => item.id === Number(sucursal.comuna_id)) ?? this.comunas[0];
    const empresa = this.empresas.find(item => item.id === Number(sucursal.empresa_id)) ?? this.empresas[0];
    const comunaUuid = this.getValidRelationUuid(comuna?.uuid) || this.getValidRelationUuid(sucursal.comuna_uuid);
    const empresaUuid = this.getValidRelationUuid(empresa?.uuid) || this.getValidRelationUuid(sucursal.empresa_uuid);

    return {
      codigo: sucursal.codigo,
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      activo: sucursal.activo !== false ? 1 : 0,
      empresaUuid,
      comunaUuid
    };
  }

  private fromApiSucursal(item: any, index: number): SucursalView {
    const comunaUuid = item.comunaUuid ?? item.comuna_uuid ?? item.comuna?.uuid;
    const empresaUuid = item.empresaUuid ?? item.empresa_uuid ?? item.empresa?.uuid;
    const comuna = this.comunas.find(row => row.uuid === comunaUuid);
    const empresa = this.empresas.find(row => row.uuid === empresaUuid);

    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? `Sucursal ${index + 1}`,
      direccion: item.direccion ?? '',
      telefono: item.telefono ?? '',
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      empresa_id: empresa?.id || Number(item.empresa_id ?? item.empresaId ?? this.empresas[0]?.id ?? 1),
      comuna_id: comuna?.id || Number(item.comuna_id ?? item.comunaId ?? this.comunas[0]?.id ?? 1),
      comuna_uuid: comunaUuid,
      empresa_uuid: empresaUuid,
      region_id: comuna?.region_id || this.getRegionIdByComuna(Number(item.comuna_id ?? item.comunaId))
    };
  }

  private fromApiComuna(item: any, index: number): Comuna {
    const nombre = item.nombre ?? item.name ?? '';
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: String(item.codigo ?? item.code ?? index + 1),
      nombre,
      region_id: Number(item.region_id ?? item.regionId ?? this.getRegionIdByComunaNombre(nombre))
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

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
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

  private getValidRelationUuid(uuid?: string) {
    if (!uuid || /^c-\d+$/i.test(uuid) || /^e-\d+$/i.test(uuid)) {
      return undefined;
    }
    return uuid;
  }

  private getRegionIdByComuna(comunaId?: number) {
    return this.comunas.find(comuna => comuna.id === Number(comunaId))?.region_id || 1;
  }

  private getRegionIdByComunaNombre(nombre: string) {
    return COMUNAS.find(comuna => comuna.nombre === nombre)?.region_id || 1;
  }
}
