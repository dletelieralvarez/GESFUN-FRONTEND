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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [FacturacionComponent],
      providers: [
        commonTestingProviders,
        { provide: DocumentoTributarioPdfService, useValue: { generar: () => Promise.resolve() } }
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

});
