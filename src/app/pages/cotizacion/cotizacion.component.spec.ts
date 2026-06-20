import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { CotizacionComponent } from './cotizacion.component';
import { authServiceMock, commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('CotizacionComponent', () => {
  let component: CotizacionComponent;
  let fixture: ComponentFixture<CotizacionComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [CotizacionComponent],
      providers: commonTestingProviders
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

  afterEach(() => {
    httpMock.verify();
    expect(authServiceMock.getAccessToken).toBeDefined();
  });
});
