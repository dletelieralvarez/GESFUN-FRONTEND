import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { CasosComponent } from './casos.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('CasosComponent', () => {
  let component: CasosComponent;
  let fixture: ComponentFixture<CasosComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [CasosComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(CasosComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  async function flushCatalogos() {
    [
      '/api/clientes',
      '/api/planes',
      '/api/sucursales',
      '/api/motivos-fallecimiento',
      '/api/usuarios',
      '/api/cotizaciones',
      '/api/agendas',
      '/api/pagos'
    ].forEach(path => httpMock.expectOne(`${bffApiUrl}${path}`).flush({ payload: [] }));
    await flushAsync();
  }

  it('should load funeral services and normalize state labels', async () => {
    const pending = component.ngOnInit();
    await flushAsync();

    await flushCatalogos();
    httpMock.expectOne(`${bffApiUrl}/api/servicios`).flush({ payload: [{
      id: 3,
      uuid: 'servicio-1',
      folio: 'SF-1',
      estado: 'EN_CURSO',
      activo: 1,
      fallecidoNombre: 'Juan Perez',
      montoTotal: 500000
    }] });
    await pending;

    expect(component.cases.length).toBe(1);
    expect(component.getEstadoLabel(component.cases[0].estado)).toBe('En curso');
    expect(component.activeCount).toBe(1);
    expect(component.serviciosDisponibles).toBeTrue();
  });

  it('should create service using quotation data in payload', async () => {
    component.cotizaciones = [{
      uuid: 'cotizacion-1',
      numero: 'COT-1',
      cliente: 'Cliente',
      clienteUuid: 'cliente-1',
      responsable: 'Cliente',
      fallecido: 'Fallecido Uno',
      fallecidoRut: '11111111-1',
      total: 750000,
      sucursalUuid: 'sucursal-1',
      planUuid: 'plan-1',
      motivoUuid: 'motivo-1'
    }];
    component.form = {
      folio: 'SF-TEST',
      cotizacion_uuid: 'cotizacion-1',
      fecha_velatorio: '2026-07-07T10:00',
      observacion: 'Servicio creado'
    };

    const pending = component.save();
    await flushAsync();

    const post = httpMock.expectOne(`${bffApiUrl}/api/servicios`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(jasmine.objectContaining({
      folio: 'SF-TEST',
      cotizacionUuid: 'cotizacion-1',
      terceroUuid: 'cliente-1',
      sucursalUuid: 'sucursal-1',
      fallecidoNombre: 'Fallecido Uno',
      montoTotal: 750000,
      estado: 'PROGRAMADO'
    }));
    post.flush({ payload: { uuid: 'servicio-1' } });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/servicios`).flush({ payload: [] });
    await pending;

    expect(component.success).toBe('Servicio funerario creado correctamente.');
    expect(component.formVisible).toBeFalse();
  });

  it('should block service save when selected quotation has incomplete data', async () => {
    component.cotizaciones = [{
      uuid: 'cotizacion-1',
      numero: 'COT-1',
      cliente: '',
      clienteUuid: '',
      responsable: '',
      fallecido: '',
      fallecidoRut: '',
      total: 0,
      sucursalUuid: '',
      planUuid: '',
      motivoUuid: ''
    }];
    component.form = { cotizacion_uuid: 'cotizacion-1' };

    await component.save();

    expect(component.error).toContain('La cotizacion seleccionada no tiene cliente');
  });
});
