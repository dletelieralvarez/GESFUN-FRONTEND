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

  it('should show backend validation detail from bff wrapped errors', () => {
    const message = (component as any).getErrorMessage({
      error: {
        message: 'Error al procesar la petición en el servicio de backend. { "status": 400, "message": "Tipo de documento tributario invalido. Use BOLETA o FACTURA." }'
      }
    }, 'Error fallback');

    expect(message).toBe('Tipo de documento tributario invalido. Use BOLETA o FACTURA.');
  });

  it('should include status and url when bff only returns generic error', () => {
    const message = (component as any).getErrorMessage({
      status: 500,
      url: 'http://localhost:8081/api/documentos-tributarios/emitir',
      error: {
        message: 'Error al procesar la petición en el servicio de backend.'
      }
    }, 'Error fallback');

    expect(message).toContain('HTTP 500');
    expect(message).toContain('/api/documentos-tributarios/emitir');
  });

  it('should register payment and emit dte in one action', async () => {
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

  it('should hide fully paid cotizaciones from payment selector', () => {
    component.cotizaciones = [
      { uuid: 'cot-pagada', numero: '1', cliente: 'Cliente pagado', total: 100000 },
      { uuid: 'cot-pendiente', numero: '2', cliente: 'Cliente pendiente', total: 150000 }
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

});
