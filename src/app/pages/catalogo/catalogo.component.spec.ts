import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { CatalogoComponent } from './catalogo.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('CatalogoComponent', () => {
  let component: CatalogoComponent;
  let fixture: ComponentFixture<CatalogoComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [CatalogoComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(CatalogoComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load active plans with kit items and services', async () => {
    const pending = component.loadCatalogo();
    await flushAsync();

    httpMock.expectOne(`${bffApiUrl}/api/planes`).flush({ payload: [
      { id: 1, uuid: 'plan-1', nombre: 'Basico', valor: 1000, activo: 1 },
      { id: 2, uuid: 'plan-inactivo', nombre: 'Inactivo', valor: 2000, activo: 0 }
    ] });
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [
      { id: 1, uuid: 'servicio-1', nombre: 'Ceremonia', tipoItem: 'S', precio: 300, activo: 1 },
      { id: 2, uuid: 'producto-1', nombre: 'Urna', tipoItem: 'P', precio: 500, activo: 1 }
    ] });
    await flushAsync();

    httpMock.expectOne(`${bffApiUrl}/api/plan-kit/plan/plan-1`).flush({ payload: [
      { productoServicioUuid: 'servicio-1', cantidad: 2, unitario: 300, activo: 1 }
    ] });
    await pending;

    expect(component.servicios.length).toBe(1);
    expect(component.plans.length).toBe(1);
    expect(component.plans[0].items).toEqual(['2 x Ceremonia']);
    expect(component.plans[0].valor).toBe(600);
  });

  it('should show connection error when catalog cannot be loaded', async () => {
    const pending = component.loadCatalogo();
    await flushAsync();

    httpMock.expectOne(`${bffApiUrl}/api/planes`).flush({}, { status: 0, statusText: 'Unknown Error' });
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [] });
    await pending;

    expect(component.error).toBe('No fue posible establecer comunicacion con el sistema. Verifique su conexion e intente nuevamente.');
    expect(component.loading).toBeFalse();
  });
});
