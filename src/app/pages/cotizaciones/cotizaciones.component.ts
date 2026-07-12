import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom, Subscription } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { CLP } from '../../data/ui-data';
import { AuthService } from '../../services/auth.service';
import { ErrorMessageService } from '../../services/error-message.service';
import {
  CotizacionPdfData,
  CotizacionPdfDetalle,
  CotizacionPdfPersona,
  CotizacionPdfService
} from '../../services/cotizacion-pdf.service';
import { UiModule } from '../../ui/ui.module';

interface CotizacionGuardada {
  uuid: string;
  numero: string;
  fecha: string;
  fechaValidez: string;
  cliente: string;
  fallecido: string;
  plan: string;
  estado: string;
  estadoUuid: string;
  estadoCodigo: string;
  total: number;
  raw: any;
}

interface EstadoCotizacionOption {
  uuid: string;
  codigo: string;
  nombre: string;
}

interface TipoDocumentoOption {
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

interface UsuarioOption {
  uuid: string;
  email: string;
  nombre: string;
  activo: boolean;
}

interface DocumentoServicio {
  uuid: string;
  cotizacionUuid: string;
  usuarioUuid: string;
  tipoDocumentoUuid: string;
  tipoDocumentoNombre: string;
  estadoDocumento: 'PENDIENTE' | 'REALIZADO' | string;
  observacion: string;
  fechaCrea: string;
}

interface DocumentoServicioForm {
  uuid: string;
  tipoDocumentoUuid: string;
  estadoDocumento: 'PENDIENTE' | 'REALIZADO';
  observacion: string;
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, UiModule],
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css']
})
export class CotizacionesComponent implements OnInit, OnDestroy {
  cotizaciones: CotizacionGuardada[] = [];
  estados: EstadoCotizacionOption[] = [];
  tiposDocumento: TipoDocumentoOption[] = [];
  usuarios: UsuarioOption[] = [];
  currentUsuarioUuid = '';
  documentosPorCotizacion: Record<string, DocumentoServicio[]> = {};
  documentosOpen: Record<string, boolean> = {};
  loadingDocumentos: Record<string, boolean> = {};
  documentoForms: Record<string, DocumentoServicioForm> = {};
  editingDocumentoUuid: Record<string, string> = {};
  estadosSeleccionados: Record<string, string> = {};
  filtro = '';
  loading = false;
  printingUuid: string | null = null;
  changingUuid: string | null = null;
  savingDocumentoUuid: string | null = null;
  deletingDocumentoUuid: string | null = null;
  error: string | null = null;
  success: string | null = null;
  clp = CLP;
  private subscriptions = new Subscription();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private pdf: CotizacionPdfService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.subscriptions.add(
      this.route.queryParamMap.subscribe(params => {
        this.filtro = params.get('q') || '';
      })
    );
    await Promise.all([this.cargarEstados(), this.cargarTiposDocumento(), this.cargarUsuarios(), this.cargarCotizaciones()]);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  get cotizacionesFiltradas() {
    const term = this.filtro.trim().toLocaleLowerCase('es-CL');
    if (!term) return this.cotizaciones;
    return this.cotizaciones.filter(item =>
      [item.numero, item.cliente, item.fallecido, item.plan, item.estado]
        .some(value => String(value || '').toLocaleLowerCase('es-CL').includes(term))
    );
  }

  nuevaCotizacion() {
    this.router.navigate(['/cotizacion']);
  }

  async cargarCotizaciones() {
    this.loading = true;
    this.error = null;
    this.success = null;
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/cotizaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.cotizaciones = this.extractPayload(response)
        .map((item, index) => this.fromApiCotizacion(item, index))
        .sort((a, b) => this.sortDate(b.fecha) - this.sortDate(a.fecha));
      this.estadosSeleccionados = Object.fromEntries(
        this.cotizaciones.map(item => [item.uuid, item.estadoUuid])
      );
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar las cotizaciones.');
    } finally {
      this.loading = false;
    }
  }

  async cambiarEstado(cotizacion: CotizacionGuardada) {
    if (this.esEstadoFinal(cotizacion)) {
      this.error = 'La cotización ya generó contrato y no permite nuevos cambios de estado.';
      return;
    }

    const estadoUuid = this.estadosSeleccionados[cotizacion.uuid];
    if (!estadoUuid || estadoUuid === cotizacion.estadoUuid) return;

    this.changingUuid = cotizacion.uuid;
    this.error = null;
    this.success = null;
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.patch(
        `${bffApiUrl}/api/cotizaciones/${cotizacion.uuid}/estado`,
        { estadoUuid },
        { headers: { Authorization: `Bearer ${token}` } }
      ));
      const detail = this.unwrapPayload(response);
      const updated = this.fromApiCotizacion(detail, 0);
      const index = this.cotizaciones.findIndex(item => item.uuid === cotizacion.uuid);
      if (index >= 0) this.cotizaciones[index] = updated;
      this.estadosSeleccionados[cotizacion.uuid] = updated.estadoUuid;

      if (updated.estadoCodigo === 'GEN_CONTR') {
        await this.pdf.generarContrato(this.toPdfData(detail, updated));
        this.success = `Estado actualizado a ${updated.estado}. Contrato descargado correctamente.`;
      } else {
        this.success = `Estado de la cotización ${updated.numero} actualizado a ${updated.estado}.`;
      }
    } catch (err: any) {
      this.estadosSeleccionados[cotizacion.uuid] = cotizacion.estadoUuid;
      this.error = this.getErrorMessage(err, 'No se pudo actualizar el estado de la cotización.');
    } finally {
      this.changingUuid = null;
    }
  }

  async reimprimir(cotizacion: CotizacionGuardada) {
    this.printingUuid = cotizacion.uuid;
    this.error = null;
    this.success = null;
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(
        `${bffApiUrl}/api/cotizaciones/${cotizacion.uuid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ));
      const detail = this.unwrapPayload(response) || cotizacion.raw;
      if (cotizacion.estadoCodigo === 'GEN_CONTR') {
        await this.pdf.generarContrato(this.toPdfData(detail, cotizacion));
        this.success = `Contrato asociado a la cotización ${cotizacion.numero} descargado correctamente.`;
      } else {
        await this.pdf.generar(this.toPdfData(detail, cotizacion));
        this.success = `PDF de la cotización ${cotizacion.numero} descargado correctamente.`;
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo volver a generar el PDF de la cotización.');
    } finally {
      this.printingUuid = null;
    }
  }

  async toggleDocumentos(cotizacion: CotizacionGuardada) {
    this.documentosOpen[cotizacion.uuid] = !this.documentosOpen[cotizacion.uuid];
    if (this.documentosOpen[cotizacion.uuid]) {
      this.ensureDocumentoForm(cotizacion.uuid);
      await this.cargarDocumentosCotizacion(cotizacion.uuid);
    }
  }

  async cargarDocumentosCotizacion(cotizacionUuid: string) {
    if (!cotizacionUuid) return;
    this.loadingDocumentos[cotizacionUuid] = true;
    this.error = null;
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/documentos-servicio/cotizacion/${cotizacionUuid}`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.documentosPorCotizacion[cotizacionUuid] = this.extractPayload(response).map(item => this.fromApiDocumentoServicio(item));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los documentos de la cotización.');
    } finally {
      this.loadingDocumentos[cotizacionUuid] = false;
    }
  }

  async guardarDocumento(cotizacion: CotizacionGuardada) {
    const form = this.ensureDocumentoForm(cotizacion.uuid);
    if (!form.tipoDocumentoUuid) {
      this.error = 'Selecciona el tipo de documento.';
      return;
    }
    if (!this.currentUsuarioUuid) {
      this.error = 'No se pudo resolver el usuario interno para registrar documentos.';
      return;
    }

    this.savingDocumentoUuid = form.uuid || cotizacion.uuid;
    this.error = null;
    this.success = null;
    try {
      const token = await this.auth.getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const payload: any = {
        usuarioUuid: this.currentUsuarioUuid,
        tipoDocumentoUuid: form.tipoDocumentoUuid,
        estadoDocumento: form.estadoDocumento,
        observacion: form.observacion || undefined
      };

      if (form.uuid) {
        const response = await lastValueFrom(this.http.put(`${bffApiUrl}/api/documentos-servicio/${form.uuid}`, payload, { headers }));
        this.replaceDocumento(cotizacion.uuid, this.fromApiDocumentoServicio(this.unwrapPayload(response)));
        this.success = 'Documento actualizado correctamente.';
      } else {
        const response = await lastValueFrom(this.http.post(`${bffApiUrl}/api/documentos-servicio`, {
          cotizacionUuid: cotizacion.uuid,
          ...payload
        }, { headers }));
        const created = this.fromApiDocumentoServicio(this.unwrapPayload(response));
        this.documentosPorCotizacion[cotizacion.uuid] = [created, ...(this.documentosPorCotizacion[cotizacion.uuid] || [])];
        this.success = 'Documento agregado correctamente.';
      }

      this.cancelarEdicionDocumento(cotizacion.uuid);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo guardar el documento.');
    } finally {
      this.savingDocumentoUuid = null;
    }
  }

  editarDocumento(cotizacionUuid: string, documento: DocumentoServicio) {
    this.editingDocumentoUuid[cotizacionUuid] = documento.uuid;
    this.documentoForms[cotizacionUuid] = {
      uuid: documento.uuid,
      tipoDocumentoUuid: documento.tipoDocumentoUuid,
      estadoDocumento: this.normalizeEstadoDocumento(documento.estadoDocumento),
      observacion: documento.observacion
    };
  }

  cancelarEdicionDocumento(cotizacionUuid: string) {
    this.editingDocumentoUuid[cotizacionUuid] = '';
    this.documentoForms[cotizacionUuid] = this.createDocumentoForm();
  }

  async eliminarDocumento(cotizacionUuid: string, documento: DocumentoServicio) {
    this.deletingDocumentoUuid = documento.uuid;
    this.error = null;
    this.success = null;
    try {
      const token = await this.auth.getAccessToken();
      await lastValueFrom(this.http.delete(`${bffApiUrl}/api/documentos-servicio/${documento.uuid}`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.documentosPorCotizacion[cotizacionUuid] = (this.documentosPorCotizacion[cotizacionUuid] || [])
        .filter(item => item.uuid !== documento.uuid);
      if (this.editingDocumentoUuid[cotizacionUuid] === documento.uuid) {
        this.cancelarEdicionDocumento(cotizacionUuid);
      }
      this.success = 'Documento eliminado correctamente.';
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo eliminar el documento.');
    } finally {
      this.deletingDocumentoUuid = null;
    }
  }

  trackByUuid(index: number, item: CotizacionGuardada) {
    return item.uuid || index;
  }

  badgeEstado(estado: string) {
    const normalized = estado.toLocaleLowerCase('es-CL');
    if (normalized.includes('acept') || normalized.includes('aprob')) return 'b-ok';
    if (normalized.includes('contrato') || normalized.includes('enviada') || normalized.includes('revision')) return 'b-info';
    if (normalized.includes('venc') || normalized.includes('anul') || normalized.includes('rechaz')) return 'b-danger';
    if (normalized.includes('pend')) return 'b-warn';
    return 'b-neutral';
  }

  esEstadoFinal(cotizacion: CotizacionGuardada) {
    return cotizacion.estadoCodigo === 'GEN_CONTR';
  }

  badgeDocumento(estado: string) {
    return estado === 'REALIZADO' ? 'b-ok' : 'b-warn';
  }

  formatFecha(value: string) {
    if (!value) return '—';
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}-${month}-${year}` : value;
  }

  private fromApiCotizacion(item: any, index: number): CotizacionGuardada {
    const pagador = item.pagador ?? item.cliente ?? item.terceroPagador ?? item.tercero_pagador;
    const fallecido = item.fallecido ?? item.terceroFallecido ?? item.tercero_fallecido;
    return {
      uuid: String(item.uuid ?? item.id ?? ''),
      numero: String(item.numero ?? item.folio ?? item.codigo ?? index + 1),
      fecha: item.fecha ?? item.fechaEmision ?? item.fecha_emision ?? '',
      fechaValidez: item.fechaValidez ?? item.fecha_validez ?? item.validaHasta ?? '',
      cliente: this.nombrePersona(pagador) || item.pagadorNombre || item.clienteNombre || 'No informado',
      fallecido: this.nombrePersona(fallecido) || item.fallecidoNombre || 'No informado',
      plan: item.plan?.nombre ?? item.planNombre ?? item.plan_nombre ?? 'No informado',
      estado: this.formatEstado(item.estado?.nombre ?? item.estadoNombre ?? item.estado_nombre ?? item.estadoCodigo ?? 'Borrador'),
      estadoUuid: String(item.estado?.uuid ?? item.estadoUuid ?? item.estado_uuid ?? ''),
      estadoCodigo: String(item.estado?.codigo ?? item.estadoCodigo ?? item.estado_codigo ?? 'BORRADOR'),
      total: Number(item.total ?? item.montoTotal ?? item.monto_total ?? 0),
      raw: item
    };
  }

  private fromApiDocumentoServicio(item: any): DocumentoServicio {
    const tipoDocumento = item.tipoDocumento ?? item.tipo_documento ?? {};
    const usuario = item.usuario ?? {};
    return {
      uuid: String(item.uuid ?? ''),
      cotizacionUuid: String(item.cotizacionUuid ?? item.cotizacion_uuid ?? item.cotizacion?.uuid ?? ''),
      usuarioUuid: String(item.usuarioUuid ?? item.usuario_uuid ?? usuario.uuid ?? ''),
      tipoDocumentoUuid: String(item.tipoDocumentoUuid ?? item.tipo_documento_uuid ?? tipoDocumento.uuid ?? ''),
      tipoDocumentoNombre: String(
        item.tipoDocumentoNombre
        ?? item.tipo_documento_nombre
        ?? tipoDocumento.nombre
        ?? tipoDocumento.codigo
        ?? 'Documento'
      ),
      estadoDocumento: String(item.estadoDocumento ?? item.estado_documento ?? 'PENDIENTE').toUpperCase(),
      observacion: String(item.observacion ?? ''),
      fechaCrea: String(item.fechaCrea ?? item.fecha_crea ?? item.creado ?? item.createdAt ?? '')
    };
  }

  private toPdfData(item: any, summary: CotizacionGuardada): CotizacionPdfData {
    const pagador = item.pagador ?? item.cliente ?? item.terceroPagador ?? item.tercero_pagador ?? {};
    const fallecido = item.fallecido ?? item.terceroFallecido ?? item.tercero_fallecido ?? {};
    const sucursal = item.sucursal ?? {};
    const plan = item.plan ?? item.suscripcionPlan ?? item.suscripcion_plan ?? {};
    const formaPago = item.formaPago ?? item.forma_pago ?? {};
    const motivo = item.motivoFallecimiento ?? item.motivo_fallecimiento ?? {};
    const detallesRaw = item.detalles ?? item.items ?? item.cotizacionDetalles ?? item.cotizacion_detalles ?? [];
    const detalles = Array.isArray(detallesRaw)
      ? detallesRaw.map((detalle: any) => this.toPdfDetalle(detalle))
      : [];
    const subtotal = Number(item.subtotal ?? item.neto ?? item.montoNeto ?? item.monto_neto ?? 0);
    const iva = Number(item.iva ?? item.impuesto ?? Math.max(0, summary.total - subtotal));
    const total = Number(item.total ?? item.montoTotal ?? item.monto_total ?? summary.total);

    return {
      numero: String(item.numero ?? item.folio ?? summary.numero),
      fecha: item.fecha ?? item.fechaEmision ?? item.fecha_emision ?? summary.fecha,
      fechaValidez: item.fechaValidez ?? item.fecha_validez ?? summary.fechaValidez,
      sucursal: sucursal.nombre ?? item.sucursalNombre ?? item.sucursal_nombre ?? 'No informada',
      direccionSucursal: sucursal.direccion ?? item.sucursalDireccion,
      telefonoSucursal: sucursal.telefono ?? item.sucursalTelefono,
      plan: plan.nombre ?? item.planNombre ?? item.plan_nombre ?? summary.plan,
      descripcionPlan: plan.descripcion ?? item.planDescripcion,
      formaPago: formaPago.nombre ?? item.formaPagoNombre ?? item.forma_pago_nombre ?? 'No informada',
      motivoFallecimiento: motivo.nombre ?? item.motivoFallecimientoNombre ?? 'No informado',
      fechaFallecimiento: item.fechaFallecimiento ?? item.fecha_fallecimiento,
      horaFallecimiento: this.hora(item.horaFallecimiento ?? item.hora_fallecimiento),
      lugarFallecimiento: item.lugarFallecimiento ?? item.lugar_fallecimiento,
      pagador: this.toPdfPersona(pagador, summary.cliente),
      fallecido: this.toPdfPersona(fallecido, summary.fallecido),
      detalles,
      subtotal: subtotal || Math.max(0, total - iva),
      iva,
      total,
      observacion: item.observacion ?? item.observaciones
    };
  }

  private toPdfDetalle(item: any): CotizacionPdfDetalle {
    const producto = item.productoServicio ?? item.producto_servicio ?? item.producto ?? item.servicio ?? {};
    const cantidad = Number(item.cantidad ?? 1);
    const unitario = Number(item.unitario ?? item.precioUnitario ?? item.precio_unitario ?? producto.precio ?? 0);
    return {
      codigo: producto.codigo ?? item.productoServicioCodigo ?? item.producto_servicio_codigo ?? item.codigo,
      nombre: producto.nombre ?? item.productoServicioNombre ?? item.producto_servicio_nombre ?? item.nombre ?? 'Producto o servicio',
      tipo: this.tipoDetalle(producto.tipoItem ?? producto.tipo_item ?? item.productoServicioTipo ?? item.producto_servicio_tipo ?? item.tipoItem ?? item.tipo),
      cantidad,
      unitario,
      total: Number(item.total ?? item.subtotal ?? cantidad * unitario),
      observacion: item.observacion
    };
  }

  private toPdfPersona(item: any, fallbackName: string): CotizacionPdfPersona {
    const tipo = item.tipoPersona ?? item.tipo_persona;
    const rut = item.rut ?? item.ruc ?? '';
    const dv = item.dv ?? '';
    return {
      tipoPersona: tipo === 'J' || tipo === 'empresa' || tipo === 'persona_juridica' ? 'J' : 'N',
      rut: rut ? `${String(rut)}${dv ? `-${dv}` : ''}` : 'No informado',
      nombre: this.nombrePersona(item) || fallbackName,
      email: item.email,
      telefono: item.telefono,
      fechaNacimiento: item.fechaNacimiento ?? item.fecha_nacimiento,
      comuna: item.comuna?.nombre ?? item.comunaNombre ?? item.comuna_nombre
    };
  }

  private nombrePersona(item: any) {
    if (!item) return '';
    return item.nombreCompleto
      ?? item.nombre_completo
      ?? item.razonSocial
      ?? item.razon_social
      ?? [item.nombres, item.apellidoPaterno ?? item.apellido_paterno, item.apellidoMaterno ?? item.apellido_materno]
        .filter(Boolean).join(' ');
  }

  private tipoDetalle(value: any) {
    const tipo = String(value ?? '').toLocaleLowerCase('es-CL');
    return tipo === 's' || tipo.includes('servicio') ? 'Servicio' : 'Producto';
  }

  private formatEstado(value: any) {
    const estado = String(value || 'Borrador').replace(/_/g, ' ').toLocaleLowerCase('es-CL');
    return estado.charAt(0).toLocaleUpperCase('es-CL') + estado.slice(1);
  }

  private async cargarEstados() {
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/estados-cotizacion`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.estados = this.extractPayload(response)
        .filter(item => item.activo === undefined || item.activo === true || item.activo === 1)
        .map(item => ({
          uuid: String(item.uuid),
          codigo: String(item.codigo),
          nombre: String(item.nombre)
        }));
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los estados de cotización.');
    }
  }

  private async cargarTiposDocumento() {
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/tipos-documento`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.tiposDocumento = this.extractPayload(response)
        .map(item => ({
          uuid: String(item.uuid ?? ''),
          codigo: String(item.codigo ?? ''),
          nombre: String(item.nombre ?? item.codigo ?? 'Documento'),
          activo: this.isActivo(item.activo)
        }))
        .filter(item => item.uuid && item.activo);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudieron cargar los tipos de documento.');
    }
  }

  private async cargarUsuarios() {
    try {
      const token = await this.auth.getAccessToken();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      }));
      this.usuarios = this.extractPayload(response)
        .map(item => ({
          uuid: String(item.uuid ?? ''),
          email: String(item.email ?? ''),
          nombre: [item.nombre, item.paterno, item.materno].filter(Boolean).join(' ') || item.email || 'Usuario',
          activo: this.isActivo(item.activo)
        }))
        .filter(item => item.uuid && item.activo);
      this.currentUsuarioUuid = this.getCurrentUserUuid();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo resolver el usuario interno.');
    }
  }

  private ensureDocumentoForm(cotizacionUuid: string) {
    if (!this.documentoForms[cotizacionUuid]) {
      this.documentoForms[cotizacionUuid] = this.createDocumentoForm();
    }
    return this.documentoForms[cotizacionUuid];
  }

  private createDocumentoForm(): DocumentoServicioForm {
    return {
      uuid: '',
      tipoDocumentoUuid: this.tiposDocumento[0]?.uuid || '',
      estadoDocumento: 'PENDIENTE',
      observacion: ''
    };
  }

  private replaceDocumento(cotizacionUuid: string, documento: DocumentoServicio) {
    this.documentosPorCotizacion[cotizacionUuid] = (this.documentosPorCotizacion[cotizacionUuid] || [])
      .map(item => item.uuid === documento.uuid ? documento : item);
  }

  private normalizeEstadoDocumento(value: any): 'PENDIENTE' | 'REALIZADO' {
    return String(value ?? '').toUpperCase() === 'REALIZADO' ? 'REALIZADO' : 'PENDIENTE';
  }

  private getCurrentUserUuid() {
    const email = this.auth.getActiveAccount()?.username?.toLocaleLowerCase('es-CL');
    return this.usuarios.find(item => item.email.toLocaleLowerCase('es-CL') === email)?.uuid
      || this.usuarios[0]?.uuid
      || '';
  }

  private hora(value: any) {
    return value ? String(value).slice(0, 5) : undefined;
  }

  private extractPayload(response: any): any[] {
    const payload = this.unwrapPayload(response);
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? payload?.items ?? [];
  }

  private unwrapPayload(response: any): any {
    return response?.payload?.payload ?? response?.payload ?? response;
  }

  private sortDate(value: string) {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private isActivo(value: any) {
    return value === undefined
      || value === null
      || value === true
      || value === 1
      || value === '1'
      || String(value).toLocaleLowerCase('es-CL') === 'true';
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 404) {
      return 'No se encontró el detalle de la cotización para volver a imprimirla.';
    }
    return ErrorMessageService.userMessage(err, fallback);
  }
}
