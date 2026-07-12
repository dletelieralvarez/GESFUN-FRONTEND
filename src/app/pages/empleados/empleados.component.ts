import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Comuna, Empresa, Region, Tercero } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';
import { ErrorMessageService } from '../../services/error-message.service';

@Component({
  selector: 'app-empleados',
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.css']
})
export class EmpleadosComponent implements OnInit, OnDestroy {
  private readonly fieldMaxLengths = {
    nombre_completo: 200,
    ruc: 12,
    dv: 1,
    email: 75,
    telefono: 15
  };

  empleados: Tercero[] = [];
  regiones: Region[] = [];
  comunas: Comuna[] = [];
  empresas: Empresa[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedEmpleado: Tercero | null = null;
  empleadoPendingDelete: Tercero | null = null;
  form: Partial<Tercero> = this.createEmptyForm();
  private successMessageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
    await this.loadEmpleados();
  }

  ngOnDestroy() {
    this.clearSuccessMessageTimeout();
  }

  get titleCount() {
    return this.empleados.length;
  }

  get comunasFiltradas() {
    const regionId = Number(this.form.region_id || 0);
    return regionId ? this.comunas.filter(c => c.region_id === regionId) : [];
  }

  trackById(index: number, item: Tercero) {
    return item.uuid || item.id;
  }

  openNew() {
    this.clearMessages();
    this.empleadoPendingDelete = null;
    this.isEditing = false;
    this.selectedEmpleado = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(empleado: Tercero) {
    this.clearMessages();
    this.empleadoPendingDelete = null;
    if (!this.isEmpleadoActivo(empleado)) {
      this.error = 'No se puede editar un empleado desactivado.';
      return;
    }
    this.isEditing = true;
    this.selectedEmpleado = empleado;
    const regionId = Number(empleado.region_id || this.getRegionIdByComuna(empleado.comuna_id) || 0);
    const comunaId = Number(empleado.comuna_id || 0);
    this.form = {
      ...empleado,
      rol: 'EMPLEADO',
      region_id: regionId,
      comuna_id: this.comunas.length && !this.isComunaInRegion(comunaId, regionId) ? 0 : comunaId,
      empresa_id: Number(empleado.empresa_id || 0)
    };
    this.formVisible = true;
  }

  delete(empleado: Tercero) {
    if (!this.isEmpleadoActivo(empleado)) {
      this.error = 'El empleado ya esta desactivado.';
      return;
    }
    this.formVisible = false;
    this.isEditing = false;
    this.selectedEmpleado = null;
    this.empleadoPendingDelete = empleado;
    this.clearMessages();
  }

  async confirmDeleteEmpleado() {
    if (!this.empleadoPendingDelete) {
      return;
    }

    const empleado = this.empleadoPendingDelete;
    this.loading = true;
    this.clearMessages();

    try {
      await this.patchEmpleadoDesactivar(empleado);
      await this.loadEmpleados();
      this.showSuccess('Empleado desactivado correctamente.');
      if (this.selectedEmpleado?.uuid === empleado.uuid) {
        this.cancel();
      }
      this.empleadoPendingDelete = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo desactivar el empleado.');
    } finally {
      this.loading = false;
    }
  }

  cancelDelete() {
    this.empleadoPendingDelete = null;
  }

  async save() {
    this.clearMessages();

    if (!this.form.nombre_completo || !this.form.ruc || !this.form.dv || !this.form.email || !this.form.telefono) {
      this.error = 'Completa nombre, RUT, email y telefono.';
      return;
    }

    const lengthError = this.validateFieldLengths();
    if (lengthError) {
      this.error = lengthError;
      return;
    }

    const formatError = this.validateFieldFormats();
    if (formatError) {
      this.error = formatError;
      return;
    }

    const selectionError = this.validateSelections();
    if (selectionError) {
      this.error = selectionError;
      return;
    }

    this.saving = true;
    const result = this.getFullTerceroFromForm();

    try {
      if (this.isEditing && this.selectedEmpleado) {
        const updated: Tercero = { ...this.selectedEmpleado, ...result, rol: 'EMPLEADO' };
        await this.putEmpleado(updated);
        await this.loadEmpleados();
        this.showSuccess('Empleado actualizado correctamente.');
      } else {
        await this.postEmpleado(result);
        await this.loadEmpleados();
        this.showSuccess('Empleado creado correctamente.');
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el empleado.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.error = null;
    this.formVisible = false;
    this.isEditing = false;
    this.selectedEmpleado = null;
    this.empleadoPendingDelete = null;
    this.form = this.createEmptyForm();
  }

  formatRut(empleado: Tercero) {
    return empleado.dv ? `${empleado.ruc}-${empleado.dv}` : empleado.ruc;
  }

  isEmpleadoActivo(empleado: Tercero) {
    return empleado.activo !== false;
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
    this.form.region_id = Number(this.form.region_id || 0);
    const comunas = this.comunasFiltradas;
    if (!comunas.some(c => c.id === Number(this.form.comuna_id))) {
      this.form.comuna_id = 0;
    }
  }

  onRutChange(value: string) {
    this.form.ruc = String(value || '').replace(/\D/g, '').slice(0, this.fieldMaxLengths.ruc);
  }

  dismissError() {
    this.error = null;
  }

  dismissSuccess() {
    this.success = null;
    this.clearSuccessMessageTimeout();
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
      activo: true,
      region_id: 0,
      comuna_id: 0,
      empresa_id: 0
    };
  }

  private getFullTerceroFromForm(): Tercero {
    return {
      ...this.form,
      rol: 'EMPLEADO',
      tipo_persona: 'persona_natural',
      activo: true,
      razon_social: this.form.razon_social,
      region_id: this.form.region_id || this.getRegionIdByComuna(this.form.comuna_id),
      nombres: this.extractNombres(this.form.nombre_completo || ''),
      apellido_paterno: this.extractApellidoPaterno(this.form.nombre_completo || ''),
      apellido_materno: this.extractApellidoMaterno(this.form.nombre_completo || '')
    } as Tercero;
  }

  private validateFieldLengths() {
    const fields = [
      { label: 'nombre completo', value: this.form.nombre_completo, max: this.fieldMaxLengths.nombre_completo },
      { label: 'RUT', value: this.form.ruc, max: this.fieldMaxLengths.ruc },
      { label: 'DV', value: this.form.dv, max: this.fieldMaxLengths.dv },
      { label: 'email', value: this.form.email, max: this.fieldMaxLengths.email },
      { label: 'telefono', value: this.form.telefono, max: this.fieldMaxLengths.telefono }
    ];
    const invalid = fields.find(field => String(field.value || '').trim().length > field.max);

    return invalid ? `El campo ${invalid.label} no puede superar ${invalid.max} caracteres.` : null;
  }

  private validateFieldFormats() {
    if (!/^\d+$/.test(String(this.form.ruc || ''))) {
      return 'El RUT / RUC debe contener solo numeros.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(this.form.email || '').trim())) {
      return 'Ingresa un email valido con arroba.';
    }

    return null;
  }

  private validateSelections() {
    if (!this.form.region_id || !this.form.comuna_id || !this.form.empresa_id) {
      return 'Selecciona region, comuna y empresa.';
    }

    if (this.comunas.length && !this.isComunaInRegion(Number(this.form.comuna_id), Number(this.form.region_id))) {
      return 'Selecciona una comuna valida para la region.';
    }

    if (this.empresas.length && !this.empresas.some(empresa => empresa.id === Number(this.form.empresa_id))) {
      return 'Selecciona una empresa valida.';
    }

    return null;
  }

  private isComunaInRegion(comunaId: number, regionId: number) {
    return this.comunas.some(comuna => comuna.id === comunaId && comuna.region_id === regionId);
  }

  private async postEmpleado(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.post(`${bffApiUrl}/api/empleados`, this.toApiPayload(tercero), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async loadEmpleados() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/empleados`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.empleados = this.extractPayload<any>(response).map((item, index) => this.fromApiEmpleado(item, index));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los empleados.');
    } finally {
      this.loading = false;
    }
  }

  private async loadCatalogos() {
    try {
      const token = await this.auth.getAccessToken();
      const [comunasResponse, regionesResponse, empresasResponse] = await Promise.all([
        lastValueFrom(this.http.get(`${bffApiUrl}/api/comunas`, { headers: { Authorization: `Bearer ${token}` } })),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/regiones`, { headers: { Authorization: `Bearer ${token}` } })).catch(() => []),
        lastValueFrom(this.http.get(`${bffApiUrl}/api/empresas`, { headers: { Authorization: `Bearer ${token}` } }))
      ]);

      const comunas = this.extractPayload<any>(comunasResponse);
      const regiones = this.extractPayload<any>(regionesResponse);
      const empresas = this.extractPayload<any>(empresasResponse);
      this.regiones = regiones.map((region, index) => this.fromApiRegion(region, index));
      if (comunas.length) {
        this.comunas = comunas.map((comuna, index) => this.fromApiComuna(comuna, index));
        if (!this.regiones.length) this.regiones = this.buildRegionesFromComunas();
        this.form.comuna_id = this.comunas[0]?.id || 1;
        this.form.region_id = this.comunas[0]?.region_id || 1;
      }
      if (empresas.length) {
        this.empresas = empresas.map((empresa, index) => this.fromApiEmpresa(empresa, index));
        this.form.empresa_id = this.empresas[0].id;
      }
    } catch (error) {
      console.warn('No se pudieron cargar comunas/empresas', error);
    }
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
  }

  private async putEmpleado(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/empleados/${tercero.uuid}`, this.toApiPayload(tercero), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async patchEmpleadoDesactivar(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.patch(`${bffApiUrl}/api/empleados/${tercero.uuid}/desactivar`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private toApiPayload(tercero: Tercero) {
    const comuna = this.comunas.find(item => item.id === Number(tercero.comuna_id));
    const empresaUuid = this.getEmpresaUuid(tercero.empresa_id);

    return {
      tipoPersona: 'N',
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
      empresaUuid
    };
  }

  private getEmpresaUuid(empresaId?: number) {
    const empresa = this.extractEmpresaFromCache(empresaId);
    return empresa?.uuid;
  }

  private extractEmpresaFromCache(empresaId?: number): Empresa | undefined {
    return this.empresas.find(item => item.id === Number(empresaId)) ?? this.empresas[0];
  }

  private fromApiEmpleado(item: any, index: number): Tercero {
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
      rol: 'EMPLEADO',
      dv: item.dv ?? '',
      email: item.email ?? '',
      fecha_nacimiento: item.fechaNacimiento ?? item.fecha_nacimiento,
      nombre_completo: nombreCompleto,
      nombre_fantasia: item.nombreFantasia ?? item.nombre_fantasia,
      nombres: item.nombres ?? this.extractNombres(nombreCompleto),
      razon_social: item.razonSocial ?? item.razon_social,
      ruc: String(item.rut ?? item.ruc ?? ''),
      telefono: item.telefono ?? '',
      tipo_persona: tipoPersona === 'J' || tipoPersona === 'empresa' ? 'empresa' : 'persona_natural',
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      region_id: comuna?.region_id || this.getRegionIdFromApiComuna(item.comuna),
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
      region_id: this.resolveRegionId(item)
    };
  }

  private fromApiRegion(item: any, index: number): Region {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: String(item.codigo ?? item.code ?? index + 1),
      nombre: item.nombre ?? item.name ?? `Region ${index + 1}`
    };
  }

  private buildRegionesFromComunas(): Region[] {
    const ids = Array.from(new Set(this.comunas.map(comuna => comuna.region_id).filter(Boolean)));
    return ids.map(id => ({ id, uuid: '', codigo: String(id), nombre: `Region ${id}` }));
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
    return ErrorMessageService.userMessage(err, fallback);
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
    return this.comunas.find(c => c.id === Number(comunaId))?.region_id || this.regiones[0]?.id || 0;
  }

  private getRegionIdFromApiComuna(comuna: any) {
    return this.resolveRegionId(comuna);
  }

  private resolveRegionId(item: any) {
    const regionUuid = item?.regionUuid ?? item?.region_uuid ?? item?.region?.uuid;
    const region = this.regiones.find(row => row.uuid === regionUuid);
    return Number(
      item?.region_id
      ?? item?.regionId
      ?? item?.region?.id
      ?? region?.id
      ?? 0
    );
  }
}
