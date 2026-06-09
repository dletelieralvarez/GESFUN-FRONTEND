import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { COMUNAS, REGIONES, TERCEROS } from '../../data/mock-data';
import { Comuna, Empresa, Tercero } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.css']
})
export class EmpleadosComponent implements OnInit {
  empleados: Tercero[] = TERCEROS.filter(t => t.rol === 'EMPLEADO');
  regiones = REGIONES;
  comunas = COMUNAS;
  empresas: Empresa[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedEmpleado: Tercero | null = null;
  form: Partial<Tercero> = this.createEmptyForm();

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.loadCatalogos();
    this.loadEmpleados();
  }

  get titleCount() {
    return this.empleados.length;
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
    this.selectedEmpleado = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(empleado: Tercero) {
    this.clearMessages();
    this.isEditing = true;
    this.selectedEmpleado = empleado;
    this.form = { ...empleado, rol: 'EMPLEADO', region_id: empleado.region_id || this.getRegionIdByComuna(empleado.comuna_id) };
    this.formVisible = true;
  }

  async delete(empleado: Tercero) {
    if (!confirm(`Eliminar empleado ${empleado.nombre_completo}?`)) {
      return;
    }

    this.loading = true;
    this.clearMessages();

    try {
      await this.patchTerceroDesactivar(empleado);
      this.empleados = this.empleados.filter(e => e.id !== empleado.id);
      this.success = 'Empleado eliminado correctamente.';
      if (this.selectedEmpleado?.id === empleado.id) {
        this.cancel();
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo eliminar el empleado.');
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
      if (this.isEditing && this.selectedEmpleado) {
        const updated: Tercero = { ...this.selectedEmpleado, ...result, rol: 'EMPLEADO' };
        await this.putTercero(updated);
        await this.loadEmpleados();
        this.success = 'Empleado actualizado correctamente.';
      } else {
        await this.postTercero(result);
        await this.loadEmpleados();
        this.success = 'Empleado creado correctamente.';
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el empleado.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedEmpleado = null;
    this.form = this.createEmptyForm();
  }

  formatRut(empleado: Tercero) {
    return empleado.dv ? `${empleado.ruc}-${empleado.dv}` : empleado.ruc;
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
      tipo_persona: 'persona_natural',
      rol: 'EMPLEADO',
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
      rol: 'EMPLEADO',
      tipo_persona: this.form.tipo_persona || 'persona_natural',
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

  private async loadEmpleados() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/terceros`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.empleados = this.extractPayload<Tercero>(response).filter(item => item.rol === 'EMPLEADO');
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los empleados.');
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
    const empresaUuid = this.getEmpresaUuid(tercero.empresa_id);

    return {
      ...tercero,
      rol: 'EMPLEADO',
      rut: tercero.ruc,
      tipoPersona: tercero.tipo_persona,
      nombreCompleto: tercero.nombre_completo,
      apellidoPaterno: tercero.apellido_paterno,
      apellidoMaterno: tercero.apellido_materno,
      razonSocial: tercero.razon_social,
      comunaUuid: comuna?.uuid,
      empresaUuid,
      region_id: Number(tercero.region_id || this.getRegionIdByComuna(tercero.comuna_id)),
      comuna_id: Number(tercero.comuna_id || 1),
      empresa_id: Number(tercero.empresa_id || 1)
    };
  }

  private getEmpresaUuid(empresaId?: number) {
    const empresa = this.extractEmpresaFromCache(empresaId);
    return empresa?.uuid;
  }

  private extractEmpresaFromCache(empresaId?: number): Empresa | undefined {
    return this.empresas.find(item => item.id === Number(empresaId)) ?? this.empresas[0];
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
