import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { AuthService } from '../../services/auth.service';

interface TipoDocumentoView {
  id: number;
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-documentacion',
  templateUrl: './documentacion.component.html',
  styleUrls: ['./documentacion.component.css']
})
export class DocumentacionComponent implements OnInit, OnDestroy {
  private readonly fieldMaxLengths = {
    codigo: 30,
    nombre: 120
  };

  documentos: TipoDocumentoView[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  formVisible = false;
  isEditing = false;
  selectedDocumento: TipoDocumentoView | null = null;
  documentoPendingDelete: TipoDocumentoView | null = null;
  form: Partial<TipoDocumentoView> = this.createEmptyForm();
  private successMessageTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadDocumentos();
  }

  ngOnDestroy() {
    this.clearSuccessMessageTimeout();
  }

  get titleCount() {
    return this.documentos.length;
  }

  trackById(index: number, item: TipoDocumentoView) {
    return item.uuid || item.id || index;
  }

  openNew() {
    this.clearMessages();
    this.documentoPendingDelete = null;
    this.isEditing = false;
    this.selectedDocumento = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  edit(documento: TipoDocumentoView) {
    this.clearMessages();
    this.documentoPendingDelete = null;
    if (!documento.activo) {
      this.error = 'No se puede editar un tipo de documento inactivo.';
      return;
    }

    this.isEditing = true;
    this.selectedDocumento = documento;
    this.form = { ...documento };
    this.formVisible = true;
  }

  delete(documento: TipoDocumentoView) {
    this.clearMessages();
    this.formVisible = false;
    this.isEditing = false;
    this.selectedDocumento = null;
    this.documentoPendingDelete = documento;
  }

  async confirmDeleteDocumento() {
    if (!this.documentoPendingDelete) return;

    const documento = this.documentoPendingDelete;
    this.loading = true;
    this.clearMessages();

    try {
      const token = await this.auth.getAccessToken();
      await lastValueFrom(this.http.delete(`${bffApiUrl}/api/tipos-documento/${documento.uuid}`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      await this.loadDocumentos();
      this.showSuccess('Tipo de documento eliminado correctamente.');
      this.documentoPendingDelete = null;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo eliminar el tipo de documento.');
    } finally {
      this.loading = false;
    }
  }

  cancelDelete() {
    this.documentoPendingDelete = null;
  }

  async save() {
    this.clearMessages();

    if (!this.form.codigo || !this.form.nombre) {
      this.error = 'Completa código y nombre.';
      return;
    }

    const validationError = this.validateForm();
    if (validationError) {
      this.error = validationError;
      return;
    }

    this.saving = true;
    const documento = this.getFullDocumentoFromForm();

    try {
      if (this.isEditing && this.selectedDocumento) {
        await this.putDocumento({ ...this.selectedDocumento, ...documento });
        await this.loadDocumentos();
        this.showSuccess('Tipo de documento actualizado correctamente.');
      } else {
        await this.postDocumento(documento);
        await this.loadDocumentos();
        this.showSuccess('Tipo de documento creado correctamente.');
      }

      this.cancel();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el tipo de documento.');
    } finally {
      this.saving = false;
    }
  }

  cancel() {
    this.error = null;
    this.formVisible = false;
    this.isEditing = false;
    this.selectedDocumento = null;
    this.form = this.createEmptyForm();
  }

  onCodigoChange(value: string) {
    this.form.codigo = String(value || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '')
      .slice(0, this.fieldMaxLengths.codigo);
  }

  dismissError() {
    this.error = null;
  }

  dismissSuccess() {
    this.success = null;
    this.clearSuccessMessageTimeout();
  }

  private createEmptyForm(): Partial<TipoDocumentoView> {
    return {
      codigo: '',
      nombre: '',
      activo: true
    };
  }

  private getFullDocumentoFromForm(): TipoDocumentoView {
    return {
      id: Number(this.form.id || 0),
      uuid: this.form.uuid || '',
      codigo: String(this.form.codigo || '').trim().toUpperCase(),
      nombre: String(this.form.nombre || '').trim(),
      activo: this.form.activo !== false
    };
  }

  private async loadDocumentos() {
    this.loading = true;
    this.error = null;

    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/tipos-documento`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.documentos = this.extractPayload<any>(response).map((item, index) => this.fromApiDocumento(item, index));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los tipos de documento.');
    } finally {
      this.loading = false;
    }
  }

  private async postDocumento(documento: TipoDocumentoView) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.post(`${bffApiUrl}/api/tipos-documento`, this.toApiPayload(documento), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private async putDocumento(documento: TipoDocumentoView) {
    const token = await this.auth.getAccessToken();
    await lastValueFrom(this.http.put(`${bffApiUrl}/api/tipos-documento/${documento.uuid}`, this.toApiPayload(documento), {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private toApiPayload(documento: TipoDocumentoView) {
    return {
      codigo: documento.codigo,
      nombre: documento.nombre,
      activo: documento.activo ? 1 : 0
    };
  }

  private fromApiDocumento(item: any, index: number): TipoDocumentoView {
    return {
      id: Number(item.id ?? index + 1),
      uuid: String(item.uuid ?? ''),
      codigo: String(item.codigo ?? ''),
      nombre: String(item.nombre ?? `Documento ${index + 1}`),
      activo: this.isActivo(item.activo)
    };
  }

  private extractPayload<T>(response: any): T[] {
    const payload = response?.payload?.payload ?? response?.payload ?? response;
    return Array.isArray(payload) ? payload : payload?.content ?? payload?.items ?? [];
  }

  private isActivo(value: any) {
    return value === undefined
      || value === null
      || value === true
      || value === 1
      || value === '1'
      || String(value).toLocaleLowerCase('es-CL') === 'true';
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
