import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { FacturacionComponent } from './facturacion.component';
import { bffApiUrl } from '../../auth-config';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { DocumentoTributarioPdfService } from '../../services/documento-tributario-pdf.service';

describe('FacturacionComponent', () => {
  let component: FacturacionComponent;
  let fixture: ComponentFixture<FacturacionComponent>;
  let httpMock: HttpTestingController;
  let documentoPdf: jasmine.SpyObj<DocumentoTributarioPdfService>;

  beforeEach(() => {
    documentoPdf = jasmine.createSpyObj<DocumentoTributarioPdfService>('DocumentoTributarioPdfService', ['generar']);
    documentoPdf.generar.and.returnValue(Promise.resolve());
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [FacturacionComponent],
      providers: [
        commonTestingProviders,
        { provide: DocumentoTributarioPdfService, useValue: documentoPdf }
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FacturacionComponent);
    component = fixture.componentInstance;
  });

  function setCotizacionFacturable() {
    component.cotizaciones = [{
      uuid: 'cot-1',
      numero: '15',
      cliente: 'Cliente responsable',
      terceroUuid: 'tercero-1',
      terceroRol: 'CLIENTE',
      total: 150000
    }];
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load pagos documentos cotizaciones and formas de pago from bff', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    httpMock.expectOne(`${bffApiUrl}/api/pagos`).flush({ success: true, payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/documentos-tributarios`).flush({ success: true, payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/cotizaciones`).flush({ success: true, payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/formas-pago`).flush({ success: true, payload: [] });

    await fixture.whenStable();
    expect(component.pagos.length).toBe(0);
    expect(component.documentos.length).toBe(0);
  });

  it('should resolve fixed dte names without loading tipos-documento', () => {
    const documento = (component as any).fromDocumento({
      uuid: 'doc-1',
      pagoUuid: 'pago-1',
      cotizacionUuid: 'cot-1',
      cotizacionNumero: 15,
      tipoDocumentoCodigo: 'BOLETA',
      estado: 'EMITIDO',
      total: 150000
    });

    expect(documento.tipoDocumentoCodigo).toBe('BOLETA');
    expect(documento.tipoDocumentoNombre).toBe('Boleta');
  });

  it('should show business validation detail from wrapped errors', () => {
    const message = (component as any).getErrorMessage({
      error: {
        message: 'Error al procesar la petición en el servicio de backend. { "status": 400, "message": "Tipo de documento tributario invalido. Use BOLETA o FACTURA." }'
      }
    }, 'Error fallback');

    expect(message).toBe('Tipo de documento tributario invalido. Use BOLETA o FACTURA.');
  });

  it('should hide technical status and url when only a generic error is returned', () => {
    const message = (component as any).getErrorMessage({
      status: 500,
      url: 'http://localhost:8080/api/documentos-tributarios/emitir',
      error: {
        message: 'Error al procesar la petición en el servicio de backend.'
      }
    }, 'Error fallback');

    expect(message).toBe('Se produjo un error interno. Intente nuevamente mas tarde.');
    expect(message).not.toContain('HTTP 500');
    expect(message).not.toContain('/api/documentos-tributarios/emitir');
  });

  it('should register payment and emit dte in one action', async () => {
    setCotizacionFacturable();
    component.pagoForm = {
      cotizacionUuid: 'cot-1',
      formaPagoUuid: 'fp-1',
      monto: 150000,
      fechaPago: '2026-06-27T10:30',
      tipoDocumentoCodigo: 'BOLETA',
      observacion: 'Abono inicial',
      observacionDte: 'Emision por pago de servicio funerario'
    };
    spyOn<any>(component, 'authHeaders').and.resolveTo({ Authorization: 'Bearer test-token' });

    const action = component.registrarPago();
    await Promise.resolve();

    const pagoRequest = httpMock.expectOne(`${bffApiUrl}/api/pagos`);
    expect(pagoRequest.request.method).toBe('POST');
    expect(pagoRequest.request.body.cotizacionUuid).toBe('cot-1');
    pagoRequest.flush({
      success: true,
      payload: {
        uuid: 'pago-1',
        cotizacionUuid: 'cot-1',
        cotizacionNumero: 15,
        formaPagoUuid: 'fp-1',
        formaPagoNombre: 'Efectivo',
        monto: 150000,
        fechaPago: '2026-06-27T10:30:00',
        estado: 'REGISTRADO'
      }
    });
    await Promise.resolve();
    await fixture.whenStable();
    await Promise.resolve();

    const dteRequest = httpMock.expectOne(`${bffApiUrl}/api/documentos-tributarios/emitir`);
    expect(dteRequest.request.method).toBe('POST');
    expect(dteRequest.request.body).toEqual({
      pagoUuid: 'pago-1',
      tipoDocumentoCodigo: 'BOLETA',
      observacion: 'Emision por pago de servicio funerario'
    });
    dteRequest.flush({
      success: true,
      payload: {
        uuid: 'doc-1',
        pagoUuid: 'pago-1',
        cotizacionUuid: 'cot-1',
        cotizacionNumero: 15,
        tipoDocumentoCodigo: 'BOLETA',
        estado: 'EMITIDO',
        total: 150000
      }
    });
    await new Promise(resolve => setTimeout(resolve, 0));

    httpMock.expectOne(`${bffApiUrl}/api/cotizaciones/cot-1`).flush({ success: true, payload: { detalles: [] } });
    await action;

    expect(component.pagos.length).toBe(1);
    expect(component.documentos.length).toBe(1);
    expect(documentoPdf.generar).toHaveBeenCalled();
    expect(component.success).toContain('Pago registrado');
  });

  it('should emit invoice without sending inventory items or calling inventory service', async () => {
    setCotizacionFacturable();
    component.pagoForm = {
      cotizacionUuid: 'cot-1',
      formaPagoUuid: 'fp-1',
      monto: 150000,
      fechaPago: '2026-06-27T10:30',
      tipoDocumentoCodigo: 'FACTURA',
      observacion: 'Pago factura',
      observacionDte: 'Emision por pago de servicio funerario'
    };
    spyOn<any>(component, 'authHeaders').and.resolveTo({ Authorization: 'Bearer test-token' });

    const action = component.registrarPago();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/pagos`).flush({
      success: true,
      payload: {
        uuid: 'pago-1',
        cotizacionUuid: 'cot-1',
        cotizacionNumero: 15,
        formaPagoUuid: 'fp-1',
        formaPagoNombre: 'Efectivo',
        monto: 150000,
        fechaPago: '2026-06-27T10:30:00',
        estado: 'REGISTRADO'
      }
    });
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));

    const dteRequest = httpMock.expectOne(`${bffApiUrl}/api/documentos-tributarios/emitir`);
    expect(dteRequest.request.method).toBe('POST');
    expect(dteRequest.request.body).toEqual({
      pagoUuid: 'pago-1',
      tipoDocumentoCodigo: 'FACTURA',
      observacion: 'Emision por pago de servicio funerario'
    });
    expect(dteRequest.request.body.productos).toBeUndefined();
    expect(dteRequest.request.body.detalles).toBeUndefined();
    expect(dteRequest.request.body.cantidades).toBeUndefined();
    dteRequest.flush({
      success: true,
      payload: {
        uuid: 'doc-1',
        pagoUuid: 'pago-1',
        cotizacionUuid: 'cot-1',
        cotizacionNumero: 15,
        tipoDocumentoCodigo: 'FACTURA',
        tipoDocumentoNombre: 'Factura',
        estado: 'EMITIDO',
        folio: '12345',
        trackId: 'DTE-20260627-12345',
        proveedor: 'DTEEMITE_SIMULADO',
        pdfUrl: 'https://dteemite.local/documentos/12345.pdf',
        xmlUrl: 'https://dteemite.local/documentos/12345.xml'
      }
    });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(httpMock.match(request => request.url.includes('/api/inventario/')).length).toBe(0);
    httpMock.expectOne(`${bffApiUrl}/api/cotizaciones/cot-1`).flush({ success: true, payload: { detalles: [] } });
    await action;

    expect(component.documentos[0].tipoDocumentoCodigo).toBe('FACTURA');
    expect(component.documentos[0].folio).toBe('12345');
    expect(component.documentos[0].trackId).toBe('DTE-20260627-12345');
    expect(documentoPdf.generar).toHaveBeenCalled();
  });

  it('should keep payment registered but report DTE errors when document emission fails', async () => {
    setCotizacionFacturable();
    component.pagoForm = {
      cotizacionUuid: 'cot-1',
      formaPagoUuid: 'fp-1',
      monto: 150000,
      fechaPago: '2026-06-27T10:30',
      tipoDocumentoCodigo: 'FACTURA',
      observacion: 'Pago completo',
      observacionDte: 'Factura solicitada'
    };
    spyOn<any>(component, 'authHeaders').and.resolveTo({ Authorization: 'Bearer test-token' });

    const action = component.registrarPago();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/pagos`).flush({
      success: true,
      payload: {
        uuid: 'pago-1',
        cotizacionUuid: 'cot-1',
        cotizacionNumero: 15,
        formaPagoUuid: 'fp-1',
        formaPagoNombre: 'Efectivo',
        monto: 150000,
        fechaPago: '2026-06-27T10:30:00',
        estado: 'REGISTRADO'
      }
    });
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));

    httpMock.expectOne(`${bffApiUrl}/api/documentos-tributarios/emitir`).flush({
      message: 'Error al procesar la petición en el servicio de backend. { "status": 400, "message": "Tipo de documento tributario invalido. Use BOLETA o FACTURA." }'
    }, { status: 400, statusText: 'Bad Request' });

    await action;

    expect(component.pagos.length).toBe(1);
    expect(component.documentos.length).toBe(0);
    expect(component.error).toBe('Tipo de documento tributario invalido. Use BOLETA o FACTURA.');
    expect(documentoPdf.generar).not.toHaveBeenCalled();
  });

  it('should show the recommended stock message when DTE emission fails after inventory output fails', async () => {
    setCotizacionFacturable();
    component.pagoForm = {
      cotizacionUuid: 'cot-1',
      formaPagoUuid: 'fp-1',
      monto: 150000,
      fechaPago: '2026-06-27T10:30',
      tipoDocumentoCodigo: 'FACTURA',
      observacion: 'Pago completo',
      observacionDte: 'Factura solicitada'
    };
    spyOn<any>(component, 'authHeaders').and.resolveTo({ Authorization: 'Bearer test-token' });

    const action = component.registrarPago();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/pagos`).flush({
      success: true,
      payload: {
        uuid: 'pago-1',
        cotizacionUuid: 'cot-1',
        cotizacionNumero: 15,
        formaPagoUuid: 'fp-1',
        formaPagoNombre: 'Efectivo',
        monto: 150000,
        fechaPago: '2026-06-27T10:30:00',
        estado: 'REGISTRADO'
      }
    });
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));

    httpMock.expectOne(`${bffApiUrl}/api/documentos-tributarios/emitir`).flush({
      message: 'Error al procesar la petición en el servicio de backend. { "status": 400, "message": "Stock insuficiente para producto URN-001." }'
    }, { status: 400, statusText: 'Bad Request' });

    await action;

    expect(component.pagos.length).toBe(1);
    expect(component.documentos.length).toBe(0);
    expect(component.error).toBe('No se pudo emitir la factura porque no hay stock suficiente para uno o más productos físicos de la cotización.');
    expect(documentoPdf.generar).not.toHaveBeenCalled();
  });

  it('should treat success false DTE responses as emission errors', async () => {
    setCotizacionFacturable();
    component.pagoForm = {
      cotizacionUuid: 'cot-1',
      formaPagoUuid: 'fp-1',
      monto: 150000,
      fechaPago: '2026-06-27T10:30',
      tipoDocumentoCodigo: 'BOLETA',
      observacion: 'Pago completo',
      observacionDte: 'Boleta solicitada'
    };
    spyOn<any>(component, 'authHeaders').and.resolveTo({ Authorization: 'Bearer test-token' });

    const action = component.registrarPago();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/pagos`).flush({
      success: true,
      payload: {
        uuid: 'pago-1',
        cotizacionUuid: 'cot-1',
        cotizacionNumero: 15,
        formaPagoUuid: 'fp-1',
        formaPagoNombre: 'Efectivo',
        monto: 150000,
        fechaPago: '2026-06-27T10:30:00',
        estado: 'REGISTRADO'
      }
    });
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));

    httpMock.expectOne(`${bffApiUrl}/api/documentos-tributarios/emitir`).flush({
      success: false,
      message: 'Cotización sin productos físicos.'
    });

    await action;

    expect(component.error).toBe('Cotización sin productos físicos.');
    expect(component.documentos.length).toBe(0);
  });

  it('should hide fully paid cotizaciones from payment selector', () => {
    component.cotizaciones = [
      { uuid: 'cot-pagada', numero: '1', cliente: 'Cliente pagado', terceroUuid: 'ter-1', terceroRol: 'CLIENTE', total: 100000 },
      { uuid: 'cot-pendiente', numero: '2', cliente: 'Cliente pendiente', terceroUuid: 'ter-2', terceroRol: 'CLIENTE', total: 150000 }
    ];
    component.pagos = [
      {
        uuid: 'pago-1',
        cotizacionUuid: 'cot-pagada',
        cotizacionNumero: '1',
        formaPagoUuid: 'fp-1',
        formaPagoNombre: 'Efectivo',
        monto: 100000,
        fechaPago: '2026-06-27T10:30:00',
        estado: 'REGISTRADO',
        observacion: ''
      },
      {
        uuid: 'pago-2',
        cotizacionUuid: 'cot-pendiente',
        cotizacionNumero: '2',
        formaPagoUuid: 'fp-1',
        formaPagoNombre: 'Efectivo',
        monto: 50000,
        fechaPago: '2026-06-27T10:30:00',
        estado: 'REGISTRADO',
        observacion: ''
      }
    ];

    expect(component.cotizacionesPendientes.map(item => item.uuid)).toEqual(['cot-pendiente']);
    expect(component.saldoCotizacion(component.cotizaciones[1])).toBe(100000);
  });

  it('should show pending quotations even when they are not billable', () => {
    component.cotizaciones = [
      { uuid: 'cot-invalida', numero: '1', cliente: 'Cliente sin rol', terceroUuid: 'ter-1', terceroRol: 'PROVEEDOR', total: 100000 },
      { uuid: 'cot-valida', numero: '2', cliente: 'Cliente válido', terceroUuid: 'ter-2', terceroRol: 'CLIENTE', total: 150000 }
    ];

    expect(component.cotizacionesPendientes.map(item => item.uuid)).toEqual(['cot-invalida', 'cot-valida']);
    expect(component.cotizacionesFacturables.map(item => item.uuid)).toEqual(['cot-valida']);
    expect(component.cotizacionLabel(component.cotizaciones[0])).not.toContain('Cliente no válido para facturar');
  });

  it('should allow attempting billing when quotation list does not include third party role data', async () => {
    component.cotizaciones = [{
      uuid: 'cot-1',
      numero: '15',
      cliente: 'Cliente pendiente de confirmar',
      terceroUuid: '',
      terceroRol: '',
      total: 150000
    }];
    component.pagoForm = {
      cotizacionUuid: 'cot-1',
      formaPagoUuid: 'fp-1',
      monto: 150000,
      fechaPago: '2026-06-27T10:30',
      tipoDocumentoCodigo: 'BOLETA',
      observacion: 'Abono inicial',
      observacionDte: 'Emision por pago de servicio funerario'
    };
    spyOn<any>(component, 'authHeaders').and.resolveTo({ Authorization: 'Bearer test-token' });

    const action = component.registrarPago();
    await Promise.resolve();

    expect(component.cotizacionesFacturables.map(item => item.uuid)).toEqual(['cot-1']);
    expect(component.cotizacionLabel(component.cotizaciones[0])).not.toContain('Cliente pendiente de confirmar por BFF');
    httpMock.expectOne(`${bffApiUrl}/api/pagos`).flush({
      success: true,
      payload: {
        uuid: 'pago-1',
        cotizacionUuid: 'cot-1',
        cotizacionNumero: 15,
        formaPagoUuid: 'fp-1',
        formaPagoNombre: 'Efectivo',
        monto: 150000,
        fechaPago: '2026-06-27T10:30:00',
        estado: 'REGISTRADO'
      }
    });
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    httpMock.expectOne(`${bffApiUrl}/api/documentos-tributarios/emitir`).flush({
      success: false,
      message: 'El tercero responsable de una salida por facturacion debe tener rol CLIENTE.'
    });

    await action;

    expect(component.error).toBe('El tercero responsable de una salida por facturacion debe tener rol CLIENTE.');
  });

  it('should block payment registration when quotation has no CLIENTE third party', async () => {
    component.cotizaciones = [{
      uuid: 'cot-1',
      numero: '15',
      cliente: 'Responsable sin rol cliente',
      terceroUuid: 'tercero-1',
      terceroRol: 'PROVEEDOR',
      total: 150000
    }];
    component.pagoForm = {
      cotizacionUuid: 'cot-1',
      formaPagoUuid: 'fp-1',
      monto: 150000,
      fechaPago: '2026-06-27T10:30',
      tipoDocumentoCodigo: 'BOLETA',
      observacion: 'Abono inicial',
      observacionDte: 'Emision por pago de servicio funerario'
    };
    spyOn<any>(component, 'authHeaders').and.resolveTo({ Authorization: 'Bearer test-token' });

    await component.registrarPago();

    expect(component.error).toBe('La cotización seleccionada no tiene un cliente responsable válido con rol CLIENTE.');
    expect((component as any).authHeaders).not.toHaveBeenCalled();
  });

});
