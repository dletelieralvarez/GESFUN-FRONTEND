import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { COMUNAS, REGIONES, TERCEROS } from '../../data/mock-data';
import { Comuna, Empresa, Tercero } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {
  proveedores: Tercero[] = TERCEROS.filter(t => t.rol === 'PROVEEDOR');
  regiones = REGIONES;
  comunas = COMUNAS;
  empresas: Empresa[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedProveedor: Tercero | null = null;
  proveedorPendingDeactivate: Tercero | null = null;
  form: Partial<Tercero> = this.createEmptyForm();

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
    await this.loadProveedores();
  }

  get titleCount() {
    return this.proveedores.length;
  }

  get comunasFiltradas() {
    return this.comunas.filter(c => !this.form.region_id || c.region_id === Number(this.form.region_id));
  }

  trackById(index: number, item: Tercero) {
    return item.uuid || item.id;
  }

  openNew() {
    this.clearMessages();
    this.proveedorPendingDeactivate = null;
    this.isEditing = false;
    this.selectedProveedor = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(proveedor: Tercero) {
    this.clearMessages();
    this.proveedorPendingDeactivate = null;
    if (!this.isProveedorActivo(proveedor)) {
      this.error = 'No se puede editar un proveedor desactivado.';
      return;
    }
    this.isEditing = true;
    this.selectedProveedor = proveedor;
    this.form = { ...proveedor, rol: 'PROVEEDOR', region_id: proveedor.region_id || this.getRegionIdByComuna(proveedor.comuna_id) };
    this.formVisible = true;
  }

  delete(proveedor: Tercero) {
    if (!this.isProveedorActivo(proveedor)) {
      this.error = 'El proveedor ya esta desactivado.';
      return;
    }

    this.formVisible = false;
    this.isEditing = false;
    this.selectedProveedor = null;
    this.proveedorPendingDeactivate = proveedor;
    this.clearMessages();
  }

  async confirmDeactivateProveedor() {
    if (!this.proveedorPendingDeactivate) {
      return;
    }

    const proveedor = this.proveedorPendingDeactivate;
    this.loading = true;
    this.clearMessages();

    try {
      await this.patchProveedorDesactivar(proveedor);
      await this.loadProveedores();
      this.success = 'Proveedor desactivado correctamente.';
      if (this.selectedProveedor?.uuid === proveedor.uuid) {
        this.cancel();
      }
      this.proveedorPendingDeactivate = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo desactivar el proveedor.');
    } finally {
      this.loading = false;
    }
  }

  cancelDeactivate() {
    this.proveedorPendingDeactivate = null;
  }

  async save() {
    this.clearMessages();

    if (!this.form.nombre_completo || !this.form.ruc || !this.form.dv || !this.form.email || !this.form.telefono) {
      this.error = 'Completa nombre, RUT, email y telefono.';
      return;
    }

    this.saving = true;
    const result = this.getFullTerceroFromForm();

    try {
      if (this.isEditing && this.selectedProveedor) {
        const updated: Tercero = { ...this.selectedProveedor, ...result, rol: 'PROVEEDOR' };
        await this.putProveedor(updated);
        await this.loadProveedores();
        this.success = 'Proveedor actualizado correctamente.';
      } else {
        await this.postProveedor(result);
        await this.loadProveedores();
        this.success = 'Proveedor creado correctamente.';
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el proveedor.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedProveedor = null;
    this.proveedorPendingDeactivate = null;
    this.form = this.createEmptyForm();
  }

  formatRut(proveedor: Tercero) {
    return proveedor.dv ? `${proveedor.ruc}-${proveedor.dv}` : proveedor.ruc;
  }

  isProveedorActivo(proveedor: Tercero) {
    return proveedor.activo !== false;
  }

  getComunaName(id?: number) {
    const comuna = this.comunas.find(c => c.id === Number(id));
    return comuna ? comuna.nombre : '';
  }

  getRegionName(id?: number) {
    const region = this.regiones.find(r => r.id === Number(id));
    return region ? region.nombre : '';
  }

  onRegionChange() {
    const comunas = this.comunasFiltradas;
    if (!comunas.some(c => c.id === Number(this.form.comuna_id))) {
      this.form.comuna_id = comunas[0]?.id;
    }
  }

  private createEmptyForm(): Partial<Tercero> {
    return {
      tipo_persona: 'empresa',
      rol: 'PROVEEDOR',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      nombre_completo: '',
      ruc: '',
      dv: '',
      email: '',
      telefono: '',
      activo: true,
      region_id: 1,
      comuna_id: 1,
      empresa_id: this.empresas[0]?.id || 1
    };
  }

  private getFullTerceroFromForm(): Tercero {
    return {
      ...this.form,
      rol: 'PROVEEDOR',
      tipo_persona: this.form.tipo_persona || 'empresa',
      activo: true,
      razon_social: this.form.tipo_persona === 'empresa' ? this.form.nombre_completo || undefined : this.form.razon_social,
      region_id: this.form.region_id || this.getRegionIdByComuna(this.form.comuna_id),
      nombres: this.form.tipo_persona === 'persona_natural' ? this.extractNombres(this.form.nombre_completo || '') : '',
      apellido_paterno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoPaterno(this.form.nombre_completo || '') : '',
      apellido_materno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoMaterno(this.form.nombre_completo || '') : ''
    } as Tercero;
  }

  private async postProveedor(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.post(`${bffApiUrl}/api/proveedores`, this.toApiPayload(tercero), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async loadProveedores() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/proveedores`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.proveedores = this.extractPayload<any>(response).map((item, index) => this.fromApiProveedor(item, index));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los proveedores.');
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
        this.form.comuna_id = this.comunas[0]?.id || 1;
        this.form.region_id = this.comunas[0]?.region_id || 1;
      }
      if (empresas.length) {
        this.empresas = empresas.map((empresa, index) => this.fromApiEmpresa(empresa, index));
        this.form.empresa_id = this.empresas[0].id;
      }
    } catch (error) {
      console.warn('No se pudieron cargar comunas/empresas desde el BFF', error);
    }
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private async putProveedor(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/proveedores/${tercero.uuid}`, this.toApiPayload(tercero), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async patchProveedorDesactivar(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.patch(`${bffApiUrl}/api/proveedores/${tercero.uuid}/desactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private toApiPayload(tercero: Tercero) {
    const comuna = this.comunas.find(item => item.id === Number(tercero.comuna_id));
    const empresa = this.empresas.find(item => item.id === Number(tercero.empresa_id)) ?? this.empresas[0];

    return {
      tipoPersona: tercero.tipo_persona === 'empresa' ? 'J' : 'N',
      rut: Number(String(tercero.ruc || '').replace(/\D/g, '')),
      dv: tercero.dv,
      nombreCompleto: tercero.nombre_completo,
      apellidoPaterno: tercero.apellido_paterno,
      apellidoMaterno: tercero.apellido_materno,
      nombres: tercero.nombres,
      razonSocial: tercero.razon_social,
      nombreFantasia: tercero.nombre_fantasia,
      email: tercero.email,
      telefono: tercero.telefono,
      activo: 1,
      comunaUuid: comuna?.uuid,
      empresaUuid: empresa?.uuid
    };
  }

  private fromApiProveedor(item: any, index: number): Tercero {
    const comunaUuid = item.comunaUuid ?? item.comuna_uuid ?? item.comuna?.uuid;
    const empresaUuid = item.empresaUuid ?? item.empresa_uuid ?? item.empresa?.uuid;
    const comuna = this.comunas.find(c => c.uuid === comunaUuid);
    const empresa = this.empresas.find(e => e.uuid === empresaUuid);
    const nombreCompleto = item.nombreCompleto ?? item.nombre_completo ?? item.razonSocial ?? item.razon_social ?? '';
    const tipoPersona = item.tipoPersona ?? item.tipo_persona;

    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      apellido_paterno: item.apellidoPaterno ?? item.apellido_paterno ?? '',
      apellido_materno: item.apellidoMaterno ?? item.apellido_materno ?? '',
      rol: 'PROVEEDOR',
      dv: item.dv ?? '',
      email: item.email ?? '',
      fecha_nacimiento: item.fechaNacimiento ?? item.fecha_nacimiento,
      nombre_completo: nombreCompleto,
      nombre_fantasia: item.nombreFantasia ?? item.nombre_fantasia,
      nombres: item.nombres ?? this.extractNombres(nombreCompleto),
      razon_social: item.razonSocial ?? item.razon_social,
      ruc: String(item.rut ?? item.ruc ?? ''),
      telefono: item.telefono ?? '',
      tipo_persona: tipoPersona === 'N' || tipoPersona === 'persona_natural' ? 'persona_natural' : 'empresa',
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      region_id: comuna?.region_id || this.getRegionIdByComunaNombre(item.comuna?.nombre ?? ''),
      comuna_id: comuna?.id || Number(item.comuna_id ?? 1),
      empresa_id: empresa?.id || Number(item.empresa_id ?? this.empresas[0]?.id ?? 1)
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

  private extractNombres(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    return parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '';
  }

  private extractApellidoPaterno(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : '';
  }

  private extractApellidoMaterno(fullName: string) {
    const parts = fullName.trim().split(' ').filter(Boolean);
    return parts.length > 2 ? parts.slice(-2, -1).join(' ') : '';
  }

  private getRegionIdByComuna(comunaId?: number) {
    return this.comunas.find(c => c.id === Number(comunaId))?.region_id || 1;
  }

  private getRegionIdByComunaNombre(nombre: string) {
    return COMUNAS.find(comuna => comuna.nombre === nombre)?.region_id || 1;
  }
}
