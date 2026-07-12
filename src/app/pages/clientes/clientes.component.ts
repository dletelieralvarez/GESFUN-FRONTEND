import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Comuna, Empresa, Region, Tercero } from '../../data/models';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';
import { ErrorMessageService } from '../../services/error-message.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  clientes: Tercero[] = [];
  regiones: Region[] = [];
  comunas: Comuna[] = [];
  empresas: Empresa[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedCliente: Tercero | null = null;
  clientePendingDeactivate: Tercero | null = null;

  form: Partial<Tercero> = this.createEmptyForm();

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
    await this.loadClientes();
  }

  trackById(index: number, item: Tercero) {
    return item.uuid || item.id;
  }

  get titleCount() {
    return this.clientes.length;
  }

  get comunasFiltradas() {
    return this.comunas.filter(c => !this.form.region_id || c.region_id === Number(this.form.region_id));
  }

  openNew() {
    this.clearMessages();
    this.clientePendingDeactivate = null;
    this.isEditing = false;
    this.selectedCliente = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(cliente: Tercero) {
    this.clearMessages();
    this.clientePendingDeactivate = null;
    if (!this.isClienteActivo(cliente)) {
      this.error = 'No se puede editar un cliente desactivado.';
      return;
    }
    this.isEditing = true;
    this.selectedCliente = cliente;
    this.form = { ...cliente, rol: 'CLIENTE', region_id: cliente.region_id || this.getRegionIdByComuna(cliente.comuna_id) };
    this.formVisible = true;
  }

  delete(cliente: Tercero) {
    if (!this.isClienteActivo(cliente)) {
      this.error = 'El cliente ya esta desactivado.';
      return;
    }

    this.formVisible = false;
    this.isEditing = false;
    this.selectedCliente = null;
    this.clientePendingDeactivate = cliente;
    this.clearMessages();
  }

  async confirmDeactivateCliente() {
    if (!this.clientePendingDeactivate) {
      return;
    }

    const cliente = this.clientePendingDeactivate;
    this.loading = true;
    this.clearMessages();

    try {
      await this.patchClienteDesactivar(cliente);
      await this.loadClientes();
      this.success = 'Cliente desactivado correctamente.';
      if (this.selectedCliente?.uuid === cliente.uuid) {
        this.cancel();
      }
      this.clientePendingDeactivate = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo desactivar el cliente.');
    } finally {
      this.loading = false;
    }
  }

  cancelDeactivate() {
    this.clientePendingDeactivate = null;
  }

  async save() {
    this.clearMessages();

    if (!this.form.nombre_completo || !this.form.ruc || !this.form.dv || !this.form.email || !this.form.telefono) {
      this.error = 'Completa nombre, RUT, email y telefono.';
      return;
    }
    if (!this.form.comuna_id || !this.form.empresa_id) {
      this.error = 'Selecciona comuna y empresa.';
      return;
    }

    this.saving = true;
    const result = this.getFullTerceroFromForm();

    try {
      if (this.isEditing && this.selectedCliente) {
        const updated: Tercero = { ...this.selectedCliente, ...result, rol: 'CLIENTE' };
        await this.putCliente(updated);
        await this.loadClientes();
        this.success = 'Cliente actualizado correctamente.';
      } else {
        await this.postCliente(result);
        await this.loadClientes();
        this.success = 'Cliente creado correctamente.';
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el cliente.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.formVisible = false;
    this.isEditing = false;
    this.selectedCliente = null;
    this.clientePendingDeactivate = null;
    this.form = this.createEmptyForm();
  }

  formatRut(cliente: Tercero) {
    return cliente.dv ? `${cliente.ruc}-${cliente.dv}` : cliente.ruc;
  }

  isClienteActivo(cliente: Tercero) {
    return cliente.activo !== false;
  }

  getComunaName(id?: number) {
    if (!id) return '';
    const c = this.comunas.find(x => x.id === id);
    return c ? c.nombre : `(${id})`;
  }

  getRegionName(id?: number) {
    if (!id) return '';
    const region = this.regiones.find(x => x.id === id);
    return region ? region.nombre : `(${id})`;
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
      razon_social: undefined,
      rol: 'CLIENTE',
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      nombre_completo: '',
      ruc: '',
      dv: '',
      email: '',
      telefono: '',
      activo: true,
      region_id: this.regiones[0]?.id || this.comunas[0]?.region_id || 0,
      comuna_id: this.comunas[0]?.id || 0,
      empresa_id: this.empresas[0]?.id || 1
    };
  }

  private getFullTerceroFromForm(): Tercero {
    return {
      ...this.form,
      tipo_persona: this.form.tipo_persona || 'persona_natural',
      activo: true,
      razon_social: this.form.tipo_persona === 'empresa' ? this.form.nombre_completo || undefined : this.form.razon_social,
      rol: 'CLIENTE',
      region_id: this.form.region_id || this.getRegionIdByComuna(this.form.comuna_id),
      nombres: this.form.tipo_persona === 'persona_natural' ? this.extractNombres(this.form.nombre_completo || '') : '',
      apellido_paterno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoPaterno(this.form.nombre_completo || '') : '',
      apellido_materno: this.form.tipo_persona === 'persona_natural' ? this.extractApellidoMaterno(this.form.nombre_completo || '') : ''
    } as Tercero;
  }

  private async postCliente(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.post(`${bffApiUrl}/api/clientes`, this.toApiPayload(tercero), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async loadClientes() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.clientes = this.extractPayload<any>(response).map((item, index) => this.fromApiCliente(item, index));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los clientes.');
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

  private async putCliente(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/clientes/${tercero.uuid}`, this.toApiPayload(tercero), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async patchClienteDesactivar(tercero: Tercero) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.patch(`${bffApiUrl}/api/clientes/${tercero.uuid}/desactivar`, {}, {
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

  private fromApiCliente(item: any, index: number): Tercero {
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
      rol: 'CLIENTE',
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
      region_id: Number(item.region_id ?? item.regionId ?? item.region?.id ?? this.regiones[0]?.id ?? 0)
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
    return Number(comuna?.region_id ?? comuna?.regionId ?? comuna?.region?.id ?? this.regiones[0]?.id ?? 0);
  }
}
