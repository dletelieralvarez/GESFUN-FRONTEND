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
  form: Partial<Tercero> = this.createEmptyForm();

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.loadCatalogos();
    this.loadProveedores();
  }

  get titleCount() {
    return this.proveedores.length;
  }

  get comunasFiltradas() {
    return this.comunas.filter(c => !this.form.region_id || c.region_id === Number(this.form.region_id));
  }

  trackById(index: number, item: Tercero) {
    return item.id;
  }

  openNew() {
    this.clearMessages();
    this.isEditing = false;
    this.selectedProveedor = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(proveedor: Tercero) {
    this.clearMessages();
    this.isEditing = true;
    this.selectedProveedor = proveedor;
    this.form = { ...proveedor, rol: 'PROVEEDOR', region_id: proveedor.region_id || this.getRegionIdByComuna(proveedor.comuna_id) };
    this.formVisible = true;
  }

  async delete(proveedor: Tercero) {
    if (!confirm(`Eliminar proveedor ${proveedor.nombre_completo}?`)) {
      return;
    }

    this.loading = true;
    this.clearMessages();

    try {
      await this.patchTerceroDesactivar(proveedor);
      this.proveedores = this.proveedores.filter(p => p.id !== proveedor.id);
      this.success = 'Proveedor eliminado correctamente.';
      if (this.selectedProveedor?.id === proveedor.id) {
        this.cancel();
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo eliminar el proveedor.');
    } finally {
      this.loading = false;
    }
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
        await this.putTercero(updated);
        await this.loadProveedores();
        this.success = 'Proveedor actualizado correctamente.';
      } else {
        await this.postTercero(result);
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
    this.form = this.createEmptyForm();
  }

  formatRut(proveedor: Tercero) {
    return proveedor.dv ? `${proveedor.ruc}-${proveedor.dv}` : proveedor.ruc;
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
      region_id: 1,
      comuna_id: 1,
      empresa_id: 1
    };
  }

  private getFullTerceroFromForm(): Tercero {
    return {
      ...this.form,
      rol: 'PROVEEDOR',
      tipo_persona: this.form.tipo_persona || 'empresa',
      razon_social: this.form.tipo_persona === 'empresa' ? this.form.nombre_completo || undefined : this.form.razon_social,
      region_id: this.form.region_id || this.getRegionIdByComuna(this.form.comuna_id),
      nombres: this.form.tipo_persona === 'persona_natural' ? this.extractNombres(this.form.nombre_completo || '') : '',
      apellido_paterno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoPaterno(this.form.nombre_completo || '') : '',
      apellido_materno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoMaterno(this.form.nombre_completo || '') : ''
    } as Tercero;
  }

  private async postTercero(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.post(`${bffApiUrl}/api/terceros`, this.toApiPayload(tercero), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async loadProveedores() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/terceros`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.proveedores = this.extractPayload<Tercero>(response).filter(item => item.rol === 'PROVEEDOR');
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

      const comunas = this.extractPayload<Comuna>(comunasResponse);
      const empresas = this.extractPayload<Empresa>(empresasResponse);
      if (comunas.length) {
        this.comunas = comunas.map(comuna => ({
          ...comuna,
          region_id: (comuna as any).region_id ?? (comuna as any).regionId ?? this.getRegionIdByComunaNombre(comuna.nombre)
        }));
      }
      if (empresas.length) {
        this.empresas = empresas;
        this.form.empresa_id = empresas[0].id;
      }
    } catch (error) {
      console.warn('No se pudieron cargar comunas/empresas desde el BFF', error);
    }
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private async putTercero(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/terceros/${tercero.uuid}`, this.toApiPayload(tercero), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async patchTerceroDesactivar(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.patch(`${bffApiUrl}/api/terceros/${tercero.uuid}/desactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private toApiPayload(tercero: Tercero) {
    const comuna = this.comunas.find(item => item.id === Number(tercero.comuna_id));
    const empresa = this.empresas.find(item => item.id === Number(tercero.empresa_id)) ?? this.empresas[0];

    return {
      ...tercero,
      rol: 'PROVEEDOR',
      rut: tercero.ruc,
      tipoPersona: tercero.tipo_persona,
      nombreCompleto: tercero.nombre_completo,
      apellidoPaterno: tercero.apellido_paterno,
      apellidoMaterno: tercero.apellido_materno,
      razonSocial: tercero.razon_social,
      comunaUuid: comuna?.uuid,
      empresaUuid: empresa?.uuid,
      region_id: Number(tercero.region_id || this.getRegionIdByComuna(tercero.comuna_id)),
      comuna_id: Number(tercero.comuna_id || 1),
      empresa_id: Number(tercero.empresa_id || 1)
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
