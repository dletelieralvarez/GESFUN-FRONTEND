import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { bffApiUrl } from '../../auth-config';
import { CLP } from '../../data/ui-data';
import { AuthService } from '../../services/auth.service';
import {
  DocumentoTributarioPdfData,
  DocumentoTributarioPdfDetalle,
  DocumentoTributarioPdfService
} from '../../services/documento-tributario-pdf.service';

interface Pago {
  uuid: string;
  cotizacionUuid: string;
  cotizacionNumero: string;
  formaPagoUuid: string;
  formaPagoNombre: string;
  monto: number;
  fechaPago: string;
  estado: 'REGISTRADO' | 'ANULADO' | string;
  observacion: string;
}

interface DocumentoTributario {
  uuid: string;
  pagoUuid: string;
  cotizacionUuid: string;
  cotizacionNumero: string;
  tipoDocumentoCodigo: string;
  tipoDocumentoNombre: string;
  estado: 'PENDIENTE' | 'ENVIADO' | 'EMITIDO' | 'RECHAZADO' | 'ANULADO' | string;
  folio: string;
  trackId: string;
  proveedor: string;
  fechaEmision: string;
  montoNeto: number;
  montoExento: number;
  iva: number;
  total: number;
  rutReceptor: string;
  razonSocialReceptor: string;
  errorMensaje: string;
  pdfUrl: string;
  xmlUrl: string;
}

interface CotizacionOption {
  uuid: string;
  numero: string;
  cliente: string;
  terceroUuid: string;
  terceroRol: string;
  total: number;
}

interface FormaPagoOption {
  uuid: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-facturacion',
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.css']
})
export class FacturacionComponent implements OnInit {
  pagos: Pago[] = [];
  documentos: DocumentoTributario[] = [];
  cotizaciones: CotizacionOption[] = [];
  formasPago: FormaPagoOption[] = [];
  tabs = ['Todos', 'Registrados', 'Anulados'];
  tab = 'Todos';
  loading = false;
  savingPago = false;
  processingUuid: string | null = null;
  error: string | null = null;
  warning: string | null = null;
  success: string | null = null;
  clp = CLP;

  pagoForm = this.createPagoForm();
  tipoDocumentos = [
    { codigo: 'BOLETA', nombre: 'Boleta' },
    { codigo: 'FACTURA', nombre: 'Factura' }
  ];

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private documentoPdf: DocumentoTributarioPdfService
  ) {}

  async ngOnInit() {
    await this.cargarFacturacion();
  }

  get pagosFiltrados() {
    if (this.tab === 'Registrados') return this.pagos.filter(item => item.estado === 'REGISTRADO');
    if (this.tab === 'Anulados') return this.pagos.filter(item => item.estado === 'ANULADO');
    return this.pagos;
  }

  get pagosRegistrados() {
    return this.pagos.filter(item => item.estado === 'REGISTRADO');
  }

  get cobradoMes() {
    const currentMonth = this.toDateInput(new Date()).slice(0, 7);
    return this.pagosRegistrados
      .filter(item => String(item.fechaPago || '').slice(0, 7) === currentMonth)
      .reduce((sum, item) => sum + item.monto, 0);
  }

  get totalRegistrado() {
    return this.pagosRegistrados.reduce((sum, item) => sum + item.monto, 0);
  }

  get pagosPorDocumentar() {
    return this.pagosRegistrados.filter(pago => !this.documentoPorPago(pago.uuid)).length;
  }

  get documentosEmitidos() {
    return this.documentos.filter(item => ['EMITIDO', 'ENVIADO'].includes(item.estado)).length;
  }

  get pagosDisponiblesDte() {
    return this.pagosRegistrados.filter(pago => !this.documentoPorPago(pago.uuid));
  }

  get cotizacionesConSaldo() {
    return this.cotizaciones.filter(cotizacion => this.saldoCotizacion(cotizacion) > 0);
  }

  get cotizacionesPendientes() {
    return this.cotizacionesConSaldo;
  }

  get cotizacionesFacturables() {
    return this.cotizacionesConSaldo.filter(cotizacion => this.cotizacionPuedeIntentarFacturar(cotizacion));
  }

  get cotizacionesConClienteInvalido() {
    return this.cotizacionesConSaldo.filter(cotizacion => this.cotizacionTieneClienteInvalidoConocido(cotizacion));
  }

  get cotizacionSeleccionada() {
    return this.cotizaciones.find(item => item.uuid === this.pagoForm.cotizacionUuid) || null;
  }

  async cargarFacturacion() {
    this.loading = true;
    this.error = null;
    this.warning = null;
    this.success = null;
    try {
      const headers = await this.authHeaders();
      const [pagosResult, documentosResult, cotizacionesResult, formasPagoResult] = await Promise.all([
        this.getListResult('pagos', `${bffApiUrl}/api/pagos`, headers),
        this.getListResult('documentos tributarios', `${bffApiUrl}/api/documentos-tributarios`, headers),
        this.getListResult('cotizaciones', `${bffApiUrl}/api/cotizaciones`, headers),
        this.getListResult('formas de pago', `${bffApiUrl}/api/formas-pago`, headers)
      ]);

      this.pagos = pagosResult.items.map(item => this.fromPago(item)).sort((a, b) => this.sortDate(b.fechaPago) - this.sortDate(a.fechaPago));
      this.documentos = documentosResult.items.map(item => this.fromDocumento(item)).sort((a, b) => this.sortDate(b.fechaEmision) - this.sortDate(a.fechaEmision));
      this.cotizaciones = cotizacionesResult.items.map((item, index) => this.fromCotizacion(item, index));
      this.formasPago = formasPagoResult.items.map(item => this.fromFormaPago(item)).filter(item => item.activo);
      this.warning = [pagosResult, documentosResult, cotizacionesResult, formasPagoResult]
        .filter(result => result.error)
        .map(result => `${result.label}: ${result.error}`)
        .join(' | ') || null;
      this.applyFormDefaults();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo cargar facturación.');
    } finally {
      this.loading = false;
    }
  }

  async registrarPago() {
    if (!this.pagoForm.cotizacionUuid || !this.pagoForm.formaPagoUuid || !this.pagoForm.monto || this.pagoForm.monto <= 0 || !this.pagoForm.tipoDocumentoCodigo) {
      this.error = 'Selecciona cotización, forma de pago, documento y un monto mayor a cero.';
      return;
    }

    const cotizacion = this.cotizacionSeleccionada;
    if (!cotizacion || this.cotizacionTieneClienteInvalidoConocido(cotizacion)) {
      this.error = 'La cotización seleccionada no tiene un cliente responsable válido con rol CLIENTE.';
      return;
    }

    this.savingPago = true;
    this.error = null;
    this.success = null;
    try {
      const headers = await this.authHeaders();
      const payload = {
        cotizacionUuid: this.pagoForm.cotizacionUuid,
        formaPagoUuid: this.pagoForm.formaPagoUuid,
        monto: Number(this.pagoForm.monto),
        fechaPago: this.toBackendDateTime(this.pagoForm.fechaPago),
        observacion: this.pagoForm.observacion || null
      };
      const response = await lastValueFrom(this.http.post(`${bffApiUrl}/api/pagos`, payload, { headers }));
      const pago = this.fromPago(this.unwrapPayload(response));
      this.pagos = [pago, ...this.pagos.filter(item => item.uuid !== pago.uuid)];
      const documento = await this.emitirDocumentoParaPago(pago, headers);
      this.documentos = [documento, ...this.documentos.filter(item => item.uuid !== documento.uuid)];
      this.pagoForm = this.createPagoForm();
      this.applyFormDefaults();
      await this.generarDocumentoPdf(documento);
      this.success = `Pago registrado y ${documento.tipoDocumentoNombre || documento.tipoDocumentoCodigo} emitida para la cotización ${pago.cotizacionNumero}.`;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo registrar el pago o emitir el documento tributario.');
    } finally {
      this.savingPago = false;
    }
  }

  async anularPago(pago: Pago) {
    if (pago.estado === 'ANULADO') return;
    this.processingUuid = pago.uuid;
    this.error = null;
    this.success = null;
    try {
      const headers = await this.authHeaders();
      const response = await lastValueFrom(this.http.patch(`${bffApiUrl}/api/pagos/${pago.uuid}/anular`, null, { headers }));
      const updated = this.fromPago(this.unwrapPayload(response));
      this.replacePago(updated);
      this.success = `Pago de la cotización ${updated.cotizacionNumero} anulado.`;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo anular el pago.');
    } finally {
      this.processingUuid = null;
    }
  }

  async anularDocumento(documento: DocumentoTributario) {
    if (documento.estado === 'ANULADO') return;
    this.processingUuid = documento.uuid;
    this.error = null;
    this.success = null;
    try {
      const headers = await this.authHeaders();
      const response = await lastValueFrom(this.http.patch(`${bffApiUrl}/api/documentos-tributarios/${documento.uuid}/anular`, null, { headers }));
      const updated = this.fromDocumento(this.unwrapPayload(response));
      this.replaceDocumento(updated);
      this.success = `Documento ${updated.folio || updated.tipoDocumentoCodigo} anulado.`;
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo anular el documento.');
    } finally {
      this.processingUuid = null;
    }
  }

  async generarDocumentoPdf(documento: DocumentoTributario) {
    await this.documentoPdf.generar(await this.toDocumentoPdfData(documento));
  }

  documentoPorPago(pagoUuid: string) {
    return this.documentos.find(item => item.pagoUuid === pagoUuid && item.estado !== 'ANULADO');
  }

  pagoLabel(pago: Pago) {
    return `Cotización ${pago.cotizacionNumero} · ${this.clp(pago.monto)} · ${this.formatFecha(pago.fechaPago)}`;
  }

  saldoCotizacion(cotizacion: CotizacionOption) {
    if (!cotizacion.total || cotizacion.total <= 0) return Number.MAX_SAFE_INTEGER;
    const pagado = this.pagosRegistrados
      .filter(pago => pago.cotizacionUuid === cotizacion.uuid)
      .reduce((sum, pago) => sum + pago.monto, 0);
    return Math.max(0, cotizacion.total - pagado);
  }

  cotizacionLabel(cotizacion: CotizacionOption) {
    const saldo = this.saldoCotizacion(cotizacion);
    const saldoLabel = saldo === Number.MAX_SAFE_INTEGER ? this.clp(cotizacion.total) : `Saldo ${this.clp(saldo)}`;
    return `${cotizacion.numero} · ${cotizacion.cliente} · ${saldoLabel}`;
  }

  badgePago(estado: string) {
    return estado === 'ANULADO' ? 'b-danger' : 'b-ok';
  }

  badgeDocumento(estado: string) {
    if (estado === 'EMITIDO' || estado === 'ENVIADO') return 'b-ok';
    if (estado === 'RECHAZADO' || estado === 'ANULADO') return 'b-danger';
    return 'b-warn';
  }

  formatFecha(value: string) {
    if (!value) return 'No informada';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('es-CL') + ' ' + date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }

  private async authHeaders() {
    const token = await this.auth.getAccessToken();
    return { Authorization: `Bearer ${token}` };
  }

  private async getList(url: string, headers: { Authorization: string }): Promise<any[]> {
    const response = await lastValueFrom(this.http.get(url, { headers }));
    const payload = this.unwrapPayload<any>(response);
    if (Array.isArray(payload)) return payload;
    return payload?.content ?? payload?.items ?? [];
  }

  private async getListResult(label: string, url: string, headers: { Authorization: string }): Promise<{ label: string; items: any[]; error: string | null }> {
    try {
      return { label, items: await this.getList(url, headers), error: null };
    } catch (err: any) {
      return { label, items: [], error: this.getErrorMessage(err, `No se pudo cargar ${label}.`) };
    }
  }

  private fromPago(item: any): Pago {
    return {
      uuid: String(item.uuid ?? ''),
      cotizacionUuid: String(item.cotizacionUuid ?? item.cotizacion_uuid ?? ''),
      cotizacionNumero: String(item.cotizacionNumero ?? item.cotizacion_numero ?? 'Sin número'),
      formaPagoUuid: String(item.formaPagoUuid ?? item.forma_pago_uuid ?? ''),
      formaPagoNombre: String(item.formaPagoNombre ?? item.forma_pago_nombre ?? 'No informada'),
      monto: Number(item.monto ?? 0),
      fechaPago: String(item.fechaPago ?? item.fecha_pago ?? ''),
      estado: String(item.estado ?? 'REGISTRADO'),
      observacion: String(item.observacion ?? '')
    };
  }

  private fromDocumento(item: any): DocumentoTributario {
    return {
      uuid: String(item.uuid ?? ''),
      pagoUuid: String(item.pagoUuid ?? item.pago_uuid ?? ''),
      cotizacionUuid: String(item.cotizacionUuid ?? item.cotizacion_uuid ?? ''),
      cotizacionNumero: String(item.cotizacionNumero ?? item.cotizacion_numero ?? 'Sin número'),
      tipoDocumentoCodigo: this.normalizeTipoDocumentoCodigo(item.tipoDocumentoCodigo ?? item.tipo_documento_codigo),
      tipoDocumentoNombre: this.resolveTipoDocumentoNombre(
        item.tipoDocumentoCodigo ?? item.tipo_documento_codigo,
        item.tipoDocumentoNombre ?? item.tipo_documento_nombre
      ),
      estado: String(item.estado ?? 'PENDIENTE'),
      folio: String(item.folio ?? ''),
      trackId: String(item.trackId ?? item.track_id ?? ''),
      proveedor: String(item.proveedor ?? ''),
      fechaEmision: String(item.fechaEmision ?? item.fecha_emision ?? item.creado ?? ''),
      montoNeto: Number(item.montoNeto ?? item.monto_neto ?? 0),
      montoExento: Number(item.montoExento ?? item.monto_exento ?? 0),
      iva: Number(item.iva ?? 0),
      total: Number(item.total ?? 0),
      rutReceptor: String(item.rutReceptor ?? item.rut_receptor ?? ''),
      razonSocialReceptor: String(item.razonSocialReceptor ?? item.razon_social_receptor ?? 'No informado'),
      errorMensaje: String(item.errorMensaje ?? item.error_mensaje ?? ''),
      pdfUrl: String(item.pdfUrl ?? item.pdf_url ?? ''),
      xmlUrl: String(item.xmlUrl ?? item.xml_url ?? '')
    };
  }

  private fromCotizacion(item: any, index: number): CotizacionOption {
    const pagador = item.pagador ?? item.cliente ?? item.terceroPagador ?? item.tercero_pagador;
    const terceroUuid = this.terceroUuidCotizacion(item, pagador);
    const terceroRol = this.rolTerceroCotizacion(item, pagador);
    return {
      uuid: String(item.uuid ?? item.id ?? ''),
      numero: String(item.numero ?? item.folio ?? item.codigo ?? index + 1),
      cliente: this.nombrePersona(pagador) || item.pagadorNombre || item.clienteNombre || 'No informado',
      terceroUuid,
      terceroRol,
      total: Number(item.total ?? item.montoTotal ?? item.monto_total ?? 0)
    };
  }

  private fromFormaPago(item: any): FormaPagoOption {
    return {
      uuid: String(item.uuid ?? ''),
      codigo: String(item.codigo ?? ''),
      nombre: String(item.nombre ?? 'Forma de pago'),
      activo: this.isActivo(item.activo)
    };
  }

  private replacePago(pago: Pago) {
    this.pagos = this.pagos.map(item => item.uuid === pago.uuid ? pago : item);
  }

  private replaceDocumento(documento: DocumentoTributario) {
    this.documentos = this.documentos.map(item => item.uuid === documento.uuid ? documento : item);
  }

  private async emitirDocumentoParaPago(pago: Pago, headers: { Authorization: string }) {
    const payload = {
      pagoUuid: pago.uuid,
      tipoDocumentoCodigo: this.pagoForm.tipoDocumentoCodigo,
      observacion: this.pagoForm.observacionDte || this.pagoForm.observacion || null
    };
    const response = await lastValueFrom(this.http.post(`${bffApiUrl}/api/documentos-tributarios/emitir`, payload, { headers }));
    if ((response as any)?.success === false) {
      throw { error: response };
    }
    return this.fromDocumento(this.unwrapPayload(response));
  }

  private async toDocumentoPdfData(documento: DocumentoTributario): Promise<DocumentoTributarioPdfData> {
    const neto = documento.montoNeto || Math.round((documento.total / 1.19) * 100) / 100;
    const iva = documento.iva || Math.max(0, Math.round((documento.total - neto) * 100) / 100);
    const detalles = await this.getCotizacionDetalles(documento);
    return {
      uuid: documento.uuid,
      pagoUuid: documento.pagoUuid,
      cotizacionNumero: documento.cotizacionNumero,
      tipoDocumentoCodigo: documento.tipoDocumentoCodigo,
      tipoDocumentoNombre: documento.tipoDocumentoNombre,
      estado: documento.estado,
      folio: documento.folio,
      trackId: documento.trackId,
      proveedor: documento.proveedor || 'DTEEMITE_SIMULADO',
      fechaEmision: documento.fechaEmision,
      montoNeto: neto,
      montoExento: documento.montoExento,
      iva,
      total: documento.total,
      rutReceptor: documento.rutReceptor,
      razonSocialReceptor: documento.razonSocialReceptor,
      pdfUrl: documento.pdfUrl,
      xmlUrl: documento.xmlUrl,
      detalles
    };
  }

  private async getCotizacionDetalles(documento: DocumentoTributario): Promise<DocumentoTributarioPdfDetalle[]> {
    if (!documento.cotizacionUuid) return [];

    try {
      const headers = await this.authHeaders();
      const response = await lastValueFrom(this.http.get(`${bffApiUrl}/api/cotizaciones/${documento.cotizacionUuid}`, { headers }));
      const cotizacion = this.unwrapPayload<any>(response);
      const detallesRaw = cotizacion?.detalles ?? cotizacion?.items ?? cotizacion?.cotizacionDetalles ?? cotizacion?.cotizacion_detalles ?? [];
      return Array.isArray(detallesRaw)
        ? detallesRaw.map(item => this.fromCotizacionDetalle(item)).filter(item => item.nombre)
        : [];
    } catch {
      return [];
    }
  }

  private fromCotizacionDetalle(item: any): DocumentoTributarioPdfDetalle {
    const producto = item.productoServicio ?? item.producto_servicio ?? item.producto ?? item.servicio ?? {};
    const cantidad = Number(item.cantidad ?? 1);
    const unitario = Number(item.unitario ?? item.precioUnitario ?? item.precio_unitario ?? producto.precio ?? 0);
    return {
      codigo: String(producto.codigo ?? item.productoServicioCodigo ?? item.producto_servicio_codigo ?? item.codigo ?? ''),
      nombre: String(producto.nombre ?? item.productoServicioNombre ?? item.producto_servicio_nombre ?? item.nombre ?? 'Producto o servicio'),
      cantidad,
      unitario,
      total: Number(item.total ?? item.subtotal ?? cantidad * unitario)
    };
  }

  private normalizeTipoDocumentoCodigo(value: any) {
    const codigo = String(value ?? 'BOLETA').toLocaleUpperCase('es-CL');
    return codigo === 'FACTURA' ? 'FACTURA' : 'BOLETA';
  }

  private resolveTipoDocumentoNombre(codigoValue: any, nombreValue: any) {
    const codigo = this.normalizeTipoDocumentoCodigo(codigoValue);
    const option = this.tipoDocumentos.find(item => item.codigo === codigo);
    return String(nombreValue || option?.nombre || codigo);
  }

  private applyFormDefaults() {
    if (!this.cotizacionesFacturables.some(item => item.uuid === this.pagoForm.cotizacionUuid)) {
      this.pagoForm.cotizacionUuid = this.cotizacionesFacturables[0]?.uuid || '';
    }
    if (!this.pagoForm.formaPagoUuid) this.pagoForm.formaPagoUuid = this.formasPago[0]?.uuid || '';
  }

  private createPagoForm() {
    return {
      cotizacionUuid: '',
      formaPagoUuid: '',
      monto: null as number | null,
      fechaPago: this.toDateTimeInput(new Date()),
      tipoDocumentoCodigo: 'BOLETA',
      observacion: '',
      observacionDte: 'Emision por pago de servicio funerario'
    };
  }

  private toBackendDateTime(value: string) {
    return value ? `${value.length === 16 ? `${value}:00` : value}` : null;
  }

  private toDateTimeInput(date: Date) {
    return `${this.toDateInput(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  private toDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private sortDate(value: string) {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isNaN(timestamp) ? 0 : timestamp;
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

  cotizacionTieneClienteValido(cotizacion: CotizacionOption) {
    return !!cotizacion.uuid
      && !!cotizacion.terceroUuid
      && this.tieneRolCliente(cotizacion.terceroRol);
  }

  cotizacionPuedeIntentarFacturar(cotizacion: CotizacionOption) {
    return !this.cotizacionTieneClienteInvalidoConocido(cotizacion);
  }

  cotizacionTieneClienteInvalidoConocido(cotizacion: CotizacionOption) {
    return !!cotizacion.terceroRol && !this.tieneRolCliente(cotizacion.terceroRol);
  }

  private terceroUuidCotizacion(item: any, pagador: any) {
    return String(
      item.terceroUuid
      ?? item.tercero_uuid
      ?? item.clienteUuid
      ?? item.cliente_uuid
      ?? item.pagadorUuid
      ?? item.pagador_uuid
      ?? item.terceroPagadorUuid
      ?? item.tercero_pagador_uuid
      ?? pagador?.uuid
      ?? pagador?.terceroUuid
      ?? pagador?.tercero_uuid
      ?? ''
    );
  }

  private rolTerceroCotizacion(item: any, pagador: any) {
    const roles = pagador?.roles ?? item.terceroRoles ?? item.tercero_roles ?? item.clienteRoles ?? item.cliente_roles;
    const rol = pagador?.rol ?? pagador?.tipoRol ?? pagador?.tipo_rol ?? item.terceroRol ?? item.tercero_rol ?? item.clienteRol ?? item.cliente_rol;
    const tipoPersona = pagador?.tipoUsuario ?? pagador?.tipo_usuario ?? item.tipoUsuario ?? item.tipo_usuario;
    const value = rol ?? roles ?? tipoPersona ?? '';
    return Array.isArray(value)
      ? value.map(itemRol => this.rolValue(itemRol)).join(',')
      : this.rolValue(value);
  }

  private tieneRolCliente(value: string) {
    return String(value || '')
      .split(/[,\s;|]+/)
      .map(item => item.trim().toLocaleUpperCase('es-CL'))
      .includes('CLIENTE');
  }

  private rolValue(value: any) {
    return String((value?.codigo ?? value?.nombre ?? value?.rol ?? value) || '').trim().toLocaleUpperCase('es-CL');
  }

  private isActivo(value: any) {
    return value === undefined
      || value === null
      || value === true
      || value === 1
      || value === '1'
      || String(value).toLocaleLowerCase('es-CL') === 'true';
  }

  private unwrapPayload<T>(response: any): T {
    return response?.payload?.payload ?? response?.payload ?? response;
  }

  private getErrorMessage(err: any, fallback: string) {
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el BFF esté disponible.';
    }
    const detail = this.extractBackendMessage(err?.error?.message)
      || this.extractBackendMessage(err?.message)
      || err?.error?.message
      || err?.message;

    if (this.isStockError(detail)) {
      return 'No se pudo emitir la factura porque no hay stock suficiente para uno o más productos físicos de la cotización.';
    }

    const generic = 'Error al procesar la petición en el servicio de backend.';
    if (detail && detail !== generic) return detail;

    const status = err?.status ? `HTTP ${err.status}` : '';
    const url = err?.url ? ` en ${err.url}` : '';
    return status ? `${generic} ${status}${url}.` : detail || fallback;
  }

  private extractBackendMessage(value: any) {
    const text = String(value || '').trim();
    if (!text) return '';

    const jsonStart = text.indexOf('{');
    if (jsonStart < 0) return text;

    const jsonText = text.slice(jsonStart);
    try {
      const detail = JSON.parse(jsonText);
      return detail?.message || text.slice(0, jsonStart).trim();
    } catch {
      const match = jsonText.match(/"message"\s*:\s*"([^"]+)"/);
      return match?.[1] || text.slice(0, jsonStart).trim() || text;
    }
  }

  private isStockError(value: any) {
    const text = String(value || '').toLocaleLowerCase('es-CL');
    return text.includes('stock') && (
      text.includes('insuficiente')
      || text.includes('no hay')
      || text.includes('sin stock')
      || text.includes('no disponible')
    );
  }
}
