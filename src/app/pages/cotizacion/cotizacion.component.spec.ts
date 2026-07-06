import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { CotizacionComponent } from './cotizacion.component';
import { authServiceMock, commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';
import { CotizacionPdfService } from '../../services/cotizacion-pdf.service';

describe('CotizacionComponent', () => {
  let component: CotizacionComponent;
  let fixture: ComponentFixture<CotizacionComponent>;
  let httpMock: HttpTestingController;
  let cotizacionPdf: jasmine.SpyObj<CotizacionPdfService>;

  beforeEach(() => {
    cotizacionPdf = jasmine.createSpyObj<CotizacionPdfService>('CotizacionPdfService', ['generar', 'generarContrato']);
    cotizacionPdf.generar.and.returnValue(Promise.resolve());
    cotizacionPdf.generarContrato.and.returnValue(Promise.resolve());
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [CotizacionComponent],
      providers: [
        commonTestingProviders,
        { provide: CotizacionPdfService, useValue: cotizacionPdf }
      ]
    });
    fixture = TestBed.createComponent(CotizacionComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load quotation catalogs and the selected plan kit', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).flush({ payload: [{ uuid: 'suc-1', nombre: 'Central', activo: 1 }] });
    httpMock.expectOne(`${bffApiUrl}/api/planes`).flush({ payload: [{ uuid: 'plan-1', nombre: 'Tradicional', activo: 1, sucursalUuid: 'suc-1' }] });
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [{ uuid: 'item-1', nombre: 'Urna', precio: 100, activo: 1, afecto: 1, tipoItem: 'P' }] });
    httpMock.expectOne(`${bffApiUrl}/api/formas-pago`).flush({ payload: [{ uuid: 'pago-1', nombre: 'Efectivo', activo: 1 }] });
    httpMock.expectOne(`${bffApiUrl}/api/motivos-fallecimiento`).flush({ payload: [{ uuid: 'motivo-1', nombre: 'Natural', activo: 1 }] });
    httpMock.expectOne(`${bffApiUrl}/api/comunas`).flush({ payload: [{ uuid: 'comuna-1', nombre: 'Santiago' }] });
    tick();
    httpMock.expectOne(`${bffApiUrl}/api/plan-kit/plan/plan-1`).flush({
      payload: [{ uuid: 'kit-1', productoServicioUuid: 'item-1', cantidad: 1, unitario: 100, activo: 1 }]
    });
    tick();

    expect(component.selectedPlanUuid).toBe('plan-1');
    expect(component.planKit.length).toBe(1);
    expect(component.planTotal).toBe(100);
  }));

  it('should exclude inactive products that remain linked to the plan kit', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).flush({ payload: [{ uuid: 'suc-1', nombre: 'Central', activo: 1 }] });
    httpMock.expectOne(`${bffApiUrl}/api/planes`).flush({ payload: [{ uuid: 'plan-1', nombre: 'Tradicional', activo: 1, sucursalUuid: 'suc-1' }] });
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({
      payload: [
        { uuid: 'item-activo', nombre: 'Urna', precio: 100, activo: 1, afecto: 1, tipoItem: 'P' },
        { uuid: 'item-inactivo', nombre: 'Anfora premium', precio: 200, activo: 0, afecto: 1, tipoItem: 'P' }
      ]
    });
    httpMock.expectOne(`${bffApiUrl}/api/formas-pago`).flush({ payload: [{ uuid: 'pago-1', nombre: 'Efectivo', activo: 1 }] });
    httpMock.expectOne(`${bffApiUrl}/api/motivos-fallecimiento`).flush({ payload: [{ uuid: 'motivo-1', nombre: 'Natural', activo: 1 }] });
    httpMock.expectOne(`${bffApiUrl}/api/comunas`).flush({ payload: [{ uuid: 'comuna-1', nombre: 'Santiago' }] });
    tick();
    httpMock.expectOne(`${bffApiUrl}/api/plan-kit/plan/plan-1`).flush({
      payload: [
        { uuid: 'kit-1', productoServicioUuid: 'item-activo', cantidad: 1, unitario: 100, activo: 1 },
        { uuid: 'kit-2', productoServicioUuid: 'item-inactivo', cantidad: 1, unitario: 200, activo: 1 }
      ]
    });
    tick();

    expect(component.planKit.map(item => item.productoServicioUuid)).toEqual(['item-activo']);
    expect(component.prestacionesNoDisponibles).toEqual(['Anfora premium']);
    expect(component.planTotal).toBe(100);
  }));

  it('should create a complete quotation in the BFF and generate its PDF', fakeAsync(() => {
    component.sucursales = [{ id: 1, uuid: 'suc-1', codigo: 'S1', nombre: 'Central', direccion: 'Av. Siempre Viva 123', telefono: '222222222', activo: true, empresa_id: 1, comuna_id: 1 }];
    component.planes = [{ id: 1, uuid: 'plan-1', nombre: 'Tradicional', descripcion: 'Plan base', valor: 0, activo: true, sucursal_id: 1, sucursal_uuid: 'suc-1' } as any];
    component.productosServicios = [
      { id: 1, uuid: 'urna-1', tipo_item: 'producto', codigo: 'URN', nombre: 'Urna', descripcion: '', precio: 100000, activo: true, afecto: true, unidad_medida_id: 1, empresa_id: 1, categoria: 'Producto' },
      { id: 2, uuid: 'cafeteria-1', tipo_item: 'servicio', codigo: 'CAF', nombre: 'Cafetería', descripcion: '', precio: 50000, activo: true, afecto: true, unidad_medida_id: 1, empresa_id: 1, categoria: 'Servicio' }
    ];
    (component as any).catalogoProductosServicios = [...component.productosServicios];
    component.formasPago = [{ id: 1, uuid: 'fp-1', codigo: 'EF', nombre: 'Efectivo', activo: true } as any];
    component.motivosFallecimiento = [{ id: 1, uuid: 'motivo-1', codigo: 'NAT', nombre: 'Natural', descripcion: '', activo: true } as any];
    component.comunas = [{ id: 1, uuid: 'comuna-1', codigo: 'STGO', nombre: 'Santiago', region_id: 1 }];
    component.planKit = [{ productoServicioUuid: 'urna-1', cantidad: 1, unitario: 100000, observacion: 'Incluido en el plan', producto: component.productosServicios[0] }];
    component.selectedSucursalUuid = 'suc-1';
    component.selectedPlanUuid = 'plan-1';
    component.selectedFormaPagoUuid = 'fp-1';
    component.selectedMotivoUuid = 'motivo-1';
    component.fecha = '2026-06-27';
    component.fechaValidez = '2026-07-07';
    component.fechaFallecimiento = '2026-06-26';
    component.horaFallecimiento = '08:30';
    component.lugarFallecimiento = 'Hospital';
    component.observacion = 'Servicio con cafetería';
    component.pagador = {
      tipoPersona: 'N',
      rut: '11111111',
      dv: '1',
      nombres: 'Ana',
      apellidoPaterno: 'Soto',
      apellidoMaterno: 'Rojas',
      razonSocial: '',
      email: 'ana@example.cl',
      telefono: '999999999',
      fechaNacimiento: '1980-01-01',
      comunaUuid: 'comuna-1'
    } as any;
    component.fallecido = {
      tipoPersona: 'N',
      rut: '22222222',
      dv: '2',
      nombres: 'Luis',
      apellidoPaterno: 'Soto',
      apellidoMaterno: '',
      razonSocial: '',
      email: '',
      telefono: '',
      fechaNacimiento: '1950-01-01',
      comunaUuid: 'comuna-1'
    } as any;
    component.toggleExtra(component.productosServicios[1]);
    component.setCantidadExtra('cafeteria-1', 2);

    component.generarCotizacion();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [
      { uuid: 'urna-1', tipoItem: 'P', codigo: 'URN', nombre: 'Urna', precio: 100000, activo: 1, afecto: 1 },
      { uuid: 'cafeteria-1', tipoItem: 'S', codigo: 'CAF', nombre: 'Cafetería', precio: 50000, activo: 1, afecto: 1 }
    ] });
    tick();

    const post = httpMock.expectOne(`${bffApiUrl}/api/cotizaciones`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(jasmine.objectContaining({
      sucursalUuid: 'suc-1',
      planUuid: 'plan-1',
      formaPagoUuid: 'fp-1',
      motivoFallecimientoUuid: 'motivo-1',
      fechaFallecimiento: '2026-06-26',
      horaFallecimiento: '08:30:00',
      lugarFallecimiento: 'Hospital'
    }));
    expect(post.request.body.pagador).toEqual(jasmine.objectContaining({
      rut: 11111111,
      dv: '1',
      nombreCompleto: 'Ana Soto Rojas',
      email: 'ana@example.cl'
    }));
    expect(post.request.body.fallecido).toEqual(jasmine.objectContaining({
      rut: 22222222,
      dv: '2',
      nombreCompleto: 'Luis Soto'
    }));
    expect(post.request.body.detalles).toEqual([
      { productoServicioUuid: 'urna-1', cantidad: 1, descuento: 0, observacion: 'Incluido en el plan' },
      { productoServicioUuid: 'cafeteria-1', cantidad: 2, descuento: 0, observacion: 'Adicional' }
    ]);
    post.flush({ payload: { uuid: 'cot-1', numero: 'COT-10', fecha: '2026-06-27', total: 238000, subtotal: 200000, iva: 38000 } });

    tick();

    expect(cotizacionPdf.generar).toHaveBeenCalled();
    expect(component.success).toContain('Cotización COT-10 creada correctamente');
  }));

  it('should autocomplete payer data when the client already exists', fakeAsync(() => {
    component.comunas = [{ id: 1, uuid: 'comuna-1', codigo: 'STGO', nombre: 'Santiago', region_id: 1 }];
    component.pagador.rut = '11111111';
    component.pagador.dv = '1';

    component.buscarPagadorExistente();
    tick();

    const request = httpMock.expectOne(`${bffApiUrl}/api/clientes`);
    expect(request.request.method).toBe('GET');
    request.flush({ payload: [
      {
        uuid: 'cliente-1',
        tipoPersona: 'N',
        rut: 11111111,
        dv: '1',
        nombreCompleto: 'Maria Perez Soto',
        nombres: 'Maria',
        apellidoPaterno: 'Perez',
        apellidoMaterno: 'Soto',
        email: 'maria@example.cl',
        telefono: '999999999',
        comunaUuid: 'comuna-1'
      }
    ] });
    tick();

    expect(component.pagador.nombres).toBe('Maria');
    expect(component.pagador.apellidoPaterno).toBe('Perez');
    expect(component.pagador.apellidoMaterno).toBe('Soto');
    expect(component.pagador.email).toBe('maria@example.cl');
    expect(component.pagador.telefono).toBe('999999999');
    expect(component.pagador.comunaUuid).toBe('comuna-1');
    expect(component.pagadorExistenteMessage).toBe('El cliente ya existe. Se autocompletaron sus datos para esta cotización.');
  }));

  it('should autocomplete company payer data when the existing client is juridical', fakeAsync(() => {
    component.pagador.rut = '76123456';
    component.pagador.dv = 'K';

    component.buscarPagadorExistente();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/clientes`).flush({ payload: [
      {
        uuid: 'cliente-empresa',
        tipoPersona: 'J',
        rut: 76123456,
        dv: 'K',
        razonSocial: 'Servicios Empresa SPA',
        email: 'contacto@empresa.cl',
        telefono: '222222222',
        comunaUuid: 'comuna-2'
      }
    ] });
    tick();

    expect(component.pagador.tipoPersona).toBe('J');
    expect(component.pagador.razonSocial).toBe('Servicios Empresa SPA');
    expect(component.pagador.nombres).toBe('');
    expect(component.pagador.email).toBe('contacto@empresa.cl');
    expect(component.pagadorExistenteMessage).toContain('El cliente ya existe');
  }));

  it('should autocomplete payer data from terceros when it is not listed as cliente', fakeAsync(() => {
    component.pagador.rut = '33333333';
    component.pagador.dv = '3';

    component.buscarPagadorExistente();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/clientes`).flush({ payload: [] });
    tick();
    const terceros = httpMock.expectOne(`${bffApiUrl}/api/terceros`);
    expect(terceros.request.method).toBe('GET');
    terceros.flush({ payload: [
      {
        uuid: 'pagador-1',
        tipoPersona: 'N',
        rut: 33333333,
        dv: '3',
        nombreCompleto: 'Carlos Mora Diaz',
        email: 'carlos@example.cl',
        telefono: '988887777',
        comunaUuid: 'comuna-3'
      }
    ] });
    tick();

    expect(component.pagador.nombres).toBe('Carlos');
    expect(component.pagador.apellidoPaterno).toBe('Mora');
    expect(component.pagador.apellidoMaterno).toBe('Diaz');
    expect(component.pagador.email).toBe('carlos@example.cl');
    expect(component.pagadorExistenteMessage).toContain('El cliente ya existe');
  }));

  it('should split full payer RUT before searching existing data', fakeAsync(() => {
    component.pagador.rut = '11.111.111-1';
    component.pagador.dv = '';

    component.buscarPagadorExistente();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/clientes`).flush({ payload: [
      {
        uuid: 'cliente-1',
        tipoPersona: 'N',
        rut: 11111111,
        dv: '1',
        nombreCompleto: 'Ana Vega Rios',
        email: 'ana@example.cl'
      }
    ] });
    tick();

    expect(component.pagador.rut).toBe('11111111');
    expect(component.pagador.dv).toBe('1');
    expect(component.pagador.nombres).toBe('Ana');
    expect(component.pagador.apellidoPaterno).toBe('Vega');
  }));

  it('should calculate payer DV and search when only numeric RUT is entered', fakeAsync(() => {
    component.pagador.rut = '16415933';
    component.pagador.dv = '';

    component.buscarPagadorExistente();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/clientes`).flush({ payload: [
      {
        uuid: 'cliente-16415933',
        tipoPersona: 'N',
        rut: 16415933,
        dv: '7',
        nombreCompleto: 'Cliente Prueba Rut',
        email: 'cliente@example.cl',
        telefono: '912345678',
        comunaUuid: 'comuna-1'
      }
    ] });
    tick();

    expect(component.pagador.rut).toBe('16415933');
    expect(component.pagador.dv).toBe('7');
    expect(component.pagador.nombres).toBe('Cliente');
    expect(component.pagador.apellidoPaterno).toBe('Prueba');
    expect(component.pagador.email).toBe('cliente@example.cl');
    expect(component.pagadorExistenteMessage).toContain('El cliente ya existe');
  }));

  it('should show BFF connection errors when quotation catalogs cannot be loaded', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).error(new ProgressEvent('error'), { status: 0 });
    httpMock.expectOne(`${bffApiUrl}/api/planes`).flush({ payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/formas-pago`).flush({ payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/motivos-fallecimiento`).flush({ payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/comunas`).flush({ payload: [] });
    tick();

    expect(component.error).toBe('No se pudo conectar con el servidor. Verifica que el BFF esté disponible.');
  }));

  afterEach(() => {
    httpMock.verify();
    expect(authServiceMock.getAccessToken).toBeDefined();
  });
});
