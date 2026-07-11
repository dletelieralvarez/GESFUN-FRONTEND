import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';
import { Sucursal } from '../../data/models';

type TipoRecursoView = {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  sucursalUuid?: string;
  sucursalNombre?: string;
};

@Component({
  selector: 'app-recursos',
  templateUrl: './recursos.component.html',
  styleUrls: ['./recursos.component.css']
})
export class RecursosComponent implements OnInit, OnDestroy {
  private readonly fieldMaxLengths = {
    codigo: 30,
    nombre: 120
  };

  recursos: TipoRecursoView[] = [];
  sucursales: Sucursal[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedRecurso: TipoRecursoView | null = null;
  recursoPendingDelete: TipoRecursoView | null = null;
  form: Partial<TipoRecursoView> = this.createEmptyForm();
  private successMessageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadCatalogos();
    await this.loadRecursos();
  }

  ngOnDestroy() {
    this.clearSuccessMessageTimeout();
  }

  get titleCount() {
    return this.recursos.length;
  }

  trackById(index: number, item: TipoRecursoView) {
    return item.uuid || item.id || index;
  }

  openNew() {
    this.clearMessages();
    this.recursoPendingDelete = null;
    this.isEditing = false;
    this.selectedRecurso = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(recurso: TipoRecursoView) {
    this.clearMessages();
    this.recursoPendingDelete = null;
    if (!recurso.activo) {
      this.error = 'No se puede editar un recurso desactivado.';
      return;
    }

    this.isEditing = true;
    this.selectedRecurso = recurso;
    this.form = { ...recurso };
    this.formVisible = true;
  }

  delete(recurso: TipoRecursoView) {
    if (!recurso.activo) {
      this.error = 'El recurso ya esta desactivado.';
      return;
    }

    this.formVisible = false;
    this.isEditing = false;
    this.selectedRecurso = null;
    this.recursoPendingDelete = recurso;
    this.clearMessages();
  }

  async confirmDeleteRecurso() {
    if (!this.recursoPendingDelete) {
      return;
    }

    const recurso = this.recursoPendingDelete;
    this.loading = true;
    this.clearMessages();

    try {
      await this.putRecurso({ ...recurso, activo: false });
      await this.loadRecursos();
      this.showSuccess('Recurso desactivado correctamente.');
      if (this.selectedRecurso?.uuid === recurso.uuid) {
        this.cancel();
      }
      this.recursoPendingDelete = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo desactivar el recurso.');
    } finally {
      this.loading = false;
    }
  }

  cancelDelete() {
    this.recursoPendingDelete = null;
  }

  async save() {
    this.clearMessages();

    if (!this.form.codigo || !this.form.nombre) {
      this.error = 'Completa codigo y nombre.';
      return;
    }

    if (!this.form.sucursalUuid) {
      this.error = 'Selecciona una sucursal.';
      return;
    }

    const validationError = this.validateForm();
    if (validationError) {
      this.error = validationError;
      return;
    }

    this.saving = true;
    const recurso = this.getFullRecursoFromForm();

    try {
      if (this.isEditing && this.selectedRecurso) {
        const updated = { ...this.selectedRecurso, ...recurso };
        await this.putRecurso(updated);
        await this.loadRecursos();
        this.showSuccess('Recurso actualizado correctamente.');
      } else {
        await this.postRecurso(recurso);
        await this.loadRecursos();
        this.showSuccess('Recurso creado correctamente.');
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el recurso.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.error = null;
    this.formVisible = false;
    this.isEditing = false;
    this.selectedRecurso = null;
    this.recursoPendingDelete = null;
    this.form = this.createEmptyForm();
  }

  onCodigoChange(value: string) {
    this.form.codigo = String(value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '')
      .slice(0, this.fieldMaxLengths.codigo);
  }

  getSucursalName(uuid?: string) {
    return this.sucursales.find(sucursal => sucursal.uuid === uuid)?.nombre || 'Sin sucursal';
  }

  dismissError() {
    this.error = null;
  }

  dismissSuccess() {
    this.success = null;
    this.clearSuccessMessageTimeout();
  }

  private createEmptyForm(): Partial<TipoRecursoView> {
    return {
      codigo: '',
      nombre: '',
      activo: true,
      sucursalUuid: this.sucursales[0]?.uuid
    };
  }

  private getFullRecursoFromForm(): TipoRecursoView {
    return {
      id: Number(this.form.id || 0),
      uuid: this.form.uuid || '',
      codigo: String(this.form.codigo || '').trim().toUpperCase(),
      nombre: String(this.form.nombre || '').trim(),
      activo: this.form.activo !== false,
      sucursalUuid: this.form.sucursalUuid,
      sucursalNombre: this.getSucursalName(this.form.sucursalUuid)
    };
  }

  private async loadRecursos() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/tipos-recurso`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.recursos = this.extractPayload<any>(response).map((item, index) => this.fromApiRecurso(item, index));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los recursos.');
    } finally {
      this.loading = false;
    }
  }

  private async loadCatalogos() {
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/sucursales`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      const sucursales = this.extractPayload<any>(response);
      if (sucursales.length) {
        this.sucursales = sucursales.map((sucursal, index) => this.fromApiSucursal(sucursal, index));
        this.form.sucursalUuid = this.sucursales[0].uuid;
      }
    } catch (error) {
      console.warn('No se pudieron cargar sucursales desde el BFF', error);
    }
  }

  private async postRecurso(recurso: TipoRecursoView) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.post(`${bffApiUrl}/api/tipos-recurso`, this.toApiPayload(recurso), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async putRecurso(recurso: TipoRecursoView) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/tipos-recurso/${recurso.uuid}`, this.toApiPayload(recurso), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private toApiPayload(recurso: TipoRecursoView) {
    return {
      codigo: recurso.codigo,
      nombre: recurso.nombre,
      activo: recurso.activo ? 1 : 0,
      sucursalUuid: recurso.sucursalUuid
    };
  }

  private fromApiRecurso(item: any, index: number): TipoRecursoView {
    const sucursalUuid = item.sucursalUuid ?? item.sucursal_uuid ?? item.sucursal?.uuid;
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: item.codigo ?? '',
      nombre: item.nombre ?? `Recurso ${index + 1}`,
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      sucursalUuid,
      sucursalNombre: item.sucursalNombre ?? item.sucursal_nombre ?? item.sucursal?.nombre ?? this.getSucursalName(sucursalUuid)
    };
  }

  private fromApiSucursal(item: any, index: number): Sucursal {
    return {
      id: Number(item.id ?? index + 1),
      uuid: item.uuid,
      codigo: String(item.codigo ?? ''),
      nombre: item.nombre ?? `Sucursal ${index + 1}`,
      direccion: item.direccion ?? '',
      telefono: item.telefono ?? '',
      activo: item.activo === undefined || item.activo === true || item.activo === 1,
      empresa_id: Number(item.empresa_id ?? item.empresaId ?? 1),
      comuna_id: Number(item.comuna_id ?? item.comunaId ?? 1)
    };
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : [];
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
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el BFF esté disponible.';
    }
    return this.sanitizeBackendMessage(err?.error?.message || err?.message || fallback);
  }

  private validateForm() {
    const codigo = String(this.form.codigo || '').trim();
    const nombre = String(this.form.nombre || '').trim();

    if (codigo.length > this.fieldMaxLengths.codigo) {
      return `El campo código no puede superar ${this.fieldMaxLengths.codigo} caracteres.`;
    }

    if (nombre.length > this.fieldMaxLengths.nombre) {
      return `El campo nombre no puede superar ${this.fieldMaxLengths.nombre} caracteres.`;
    }

    if (!/^[A-Z0-9_-]+$/i.test(codigo)) {
      return 'El código solo puede contener letras, números, guion y guion bajo.';
    }

    return null;
  }

  private sanitizeBackendMessage(message: string) {
    const text = String(message || '').trim();
    const jsonStart = text.indexOf('{');

    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(text.slice(jsonStart));
        return parsed?.message || text.slice(0, jsonStart).trim() || text;
      } catch {
        return text.slice(0, jsonStart).trim() || text;
      }
    }

    return text;
  }
}
