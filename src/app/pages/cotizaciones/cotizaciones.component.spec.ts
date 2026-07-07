import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CotizacionesComponent } from './cotizaciones.component';
import { bffApiUrl } from '../../auth-config';
import { commonTestingProviders } from '../../testing/test-bed-utils';
import { CotizacionPdfService } from '../../services/cotizacion-pdf.service';

describe('CotizacionesComponent', () => {
  let component: CotizacionesComponent;
  let fixture: ComponentFixture<CotizacionesComponent>;
  let httpMock: HttpTestingController;
  let pdf: jasmine.SpyObj<CotizacionPdfService>;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    pdf = jasmine.createSpyObj<CotizacionPdfService>('CotizacionPdfService', ['generar', 'generarContrato']);
    pdf.generar.and.returnValue(Promise.resolve());
    pdf.generarContrato.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [CotizacionesComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        commonTestingProviders,
        { provide: CotizacionPdfService, useValue: pdf }
      ]
    });
    fixture = TestBed.createComponent(CotizacionesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load quotation states and saved quotations from the BFF', async () => {
    const pendingEstados = (component as any).cargarEstados();
    const pendingCotizaciones = component.cargarCotizaciones();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/estados-cotizacion`).flush({ payload: [
      { uuid: 'estado-1', codigo: 'BORRADOR', nombre: 'Borrador', activo: 1 }
    ] });
    httpMock.expectOne(`${bffApiUrl}/api/cotizaciones`).flush({ payload: [
      {
        uuid: 'cot-1',
        numero: 'COT-1',
        fecha: '2026-06-27',
        fechaValidez: '2026-07-07',
        pagador: { nombres: 'Ana', apellidoPaterno: 'Soto' },
        fallecido: { nombres: 'Luis', apellidoPaterno: 'Soto' },
        plan: { nombre: 'Tradicional' },
        estado: { uuid: 'estado-1', codigo: 'BORRADOR', nombre: 'Borrador' },
        total: 150000
      }
    ] });

    await Promise.all([pendingEstados, pendingCotizaciones]);
    await flushAsync();

    expect(component.estados.length).toBe(1);
    expect(component.cotizaciones[0].numero).toBe('COT-1');
    expect(component.estadosSeleccionados['cot-1']).toBe('estado-1');
  });

  it('should generate a contract when quotation state changes to generated contract', async () => {
    const cotizacion: any = {
      uuid: 'cot-1',
      numero: 'COT-1',
      fecha: '2026-06-27',
      fechaValidez: '2026-07-07',
      cliente: 'Ana Soto',
      fallecido: 'Luis Soto',
      plan: 'Tradicional',
      estado: 'Aceptada',
      estadoUuid: 'estado-aceptada',
      estadoCodigo: 'ACEPTADA',
      total: 150000,
      raw: {}
    };
    component.cotizaciones = [cotizacion];
    component.estadosSeleccionados = { 'cot-1': 'estado-contrato' };

    const action = component.cambiarEstado(cotizacion);
    await Promise.resolve();

    const patch = httpMock.expectOne(`${bffApiUrl}/api/cotizaciones/cot-1/estado`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ estadoUuid: 'estado-contrato' });
    patch.flush({ payload: {
      uuid: 'cot-1',
      numero: 'COT-1',
      fecha: '2026-06-27',
      fechaValidez: '2026-07-07',
      pagador: { rut: 11111111, dv: '1', nombres: 'Ana', apellidoPaterno: 'Soto' },
      fallecido: { rut: 22222222, dv: '2', nombres: 'Luis', apellidoPaterno: 'Soto' },
      plan: { nombre: 'Tradicional' },
      formaPago: { nombre: 'Efectivo' },
      motivoFallecimiento: { nombre: 'Natural' },
      estado: { uuid: 'estado-contrato', codigo: 'GEN_CONTR', nombre: 'Contrato generado' },
      detalles: [{ productoServicio: { codigo: 'URN', nombre: 'Urna', tipoItem: 'P' }, cantidad: 1, unitario: 150000 }],
      subtotal: 126050,
      iva: 23950,
      total: 150000
    } });

    await action;

    expect(pdf.generarContrato).toHaveBeenCalled();
    expect(component.success).toContain('Contrato descargado correctamente');
  });

  it('should reprint contract instead of quotation PDF for final contract state', async () => {
    const cotizacion: any = {
      uuid: 'cot-1',
      numero: 'COT-1',
      fecha: '2026-06-27',
      fechaValidez: '2026-07-07',
      cliente: 'Ana Soto',
      fallecido: 'Luis Soto',
      plan: 'Tradicional',
      estado: 'Contrato generado',
      estadoUuid: 'estado-contrato',
      estadoCodigo: 'GEN_CONTR',
      total: 150000,
      raw: {}
    };

    const action = component.reimprimir(cotizacion);
    await Promise.resolve();

    const detail = httpMock.expectOne(`${bffApiUrl}/api/cotizaciones/cot-1`);
    expect(detail.request.method).toBe('GET');
    detail.flush({ payload: {
      uuid: 'cot-1',
      numero: 'COT-1',
      pagador: { nombres: 'Ana', apellidoPaterno: 'Soto' },
      fallecido: { nombres: 'Luis', apellidoPaterno: 'Soto' },
      detalles: []
    } });

    await action;

    expect(pdf.generarContrato).toHaveBeenCalled();
    expect(pdf.generar).not.toHaveBeenCalled();
    expect(component.success).toContain('Contrato asociado');
  });

  it('should load document catalogs users and quotation documents', async () => {
    const pendingTipos = (component as any).cargarTiposDocumento();
    const pendingUsuarios = (component as any).cargarUsuarios();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/tipos-documento`).flush({ payload: [
      { uuid: 'tipo-1', codigo: 'CERT', nombre: 'Certificado', activo: 1 }
    ] });
    httpMock.expectOne(`${bffApiUrl}/api/usuarios`).flush({ payload: [
      { uuid: 'usuario-1', email: 'test@gesfun.cl', nombre: 'Usuario', activo: 1 }
    ] });

    await Promise.all([pendingTipos, pendingUsuarios]);

    expect(component.tiposDocumento[0].uuid).toBe('tipo-1');
    expect(component.currentUsuarioUuid).toBe('usuario-1');

    const pendingDocs = component.cargarDocumentosCotizacion('cot-1');
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/documentos-servicio/cotizacion/cot-1`).flush({ payload: [
      {
        uuid: 'doc-1',
        cotizacionUuid: 'cot-1',
        usuarioUuid: 'usuario-1',
        tipoDocumentoUuid: 'tipo-1',
        tipoDocumento: { nombre: 'Certificado' },
        estadoDocumento: 'PENDIENTE',
        observacion: 'Solicitado'
      }
    ] });

    await pendingDocs;

    expect(component.documentosPorCotizacion['cot-1'].length).toBe(1);
    expect(component.documentosPorCotizacion['cot-1'][0].tipoDocumentoNombre).toBe('Certificado');
  });

  it('should create update and delete quotation service documents', async () => {
    const cotizacion: any = { uuid: 'cot-1', numero: 'COT-1' };
    component.tiposDocumento = [{ uuid: 'tipo-1', codigo: 'CERT', nombre: 'Certificado', activo: true }];
    component.currentUsuarioUuid = 'usuario-1';
    component.documentoForms['cot-1'] = {
      uuid: '',
      tipoDocumentoUuid: 'tipo-1',
      estadoDocumento: 'PENDIENTE',
      observacion: 'Documento solicitado'
    };

    const createAction = component.guardarDocumento(cotizacion);
    await Promise.resolve();

    const post = httpMock.expectOne(`${bffApiUrl}/api/documentos-servicio`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      cotizacionUuid: 'cot-1',
      usuarioUuid: 'usuario-1',
      tipoDocumentoUuid: 'tipo-1',
      estadoDocumento: 'PENDIENTE',
      observacion: 'Documento solicitado'
    });
    post.flush({ payload: {
      uuid: 'doc-1',
      cotizacionUuid: 'cot-1',
      usuarioUuid: 'usuario-1',
      tipoDocumentoUuid: 'tipo-1',
      tipoDocumentoNombre: 'Certificado',
      estadoDocumento: 'PENDIENTE',
      observacion: 'Documento solicitado'
    } });
    await createAction;

    expect(component.documentosPorCotizacion['cot-1'].length).toBe(1);

    component.editarDocumento('cot-1', component.documentosPorCotizacion['cot-1'][0]);
    component.documentoForms['cot-1'].estadoDocumento = 'REALIZADO';
    component.documentoForms['cot-1'].observacion = 'Documento recibido';

    const updateAction = component.guardarDocumento(cotizacion);
    await Promise.resolve();

    const put = httpMock.expectOne(`${bffApiUrl}/api/documentos-servicio/doc-1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      usuarioUuid: 'usuario-1',
      tipoDocumentoUuid: 'tipo-1',
      estadoDocumento: 'REALIZADO',
      observacion: 'Documento recibido'
    });
    put.flush({ payload: {
      uuid: 'doc-1',
      cotizacionUuid: 'cot-1',
      usuarioUuid: 'usuario-1',
      tipoDocumentoUuid: 'tipo-1',
      tipoDocumentoNombre: 'Certificado',
      estadoDocumento: 'REALIZADO',
      observacion: 'Documento recibido'
    } });
    await updateAction;

    expect(component.documentosPorCotizacion['cot-1'][0].estadoDocumento).toBe('REALIZADO');

    const deleteAction = component.eliminarDocumento('cot-1', component.documentosPorCotizacion['cot-1'][0]);
    await Promise.resolve();

    const del = httpMock.expectOne(`${bffApiUrl}/api/documentos-servicio/doc-1`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await deleteAction;

    expect(component.documentosPorCotizacion['cot-1'].length).toBe(0);
  });
});
