import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [DashboardComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data from the BFF', fakeAsync(() => {
    component.ngOnInit();
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).flush({
      payload: [{ uuid: 'sucursal-1', codigo: 'S1', nombre: 'Central', activo: true }]
    });
    httpMock.expectOne(`${bffApiUrl}/api/cotizaciones`).flush({
      payload: [{ uuid: 'cot-1', numero: 12, total: 1000, estadoCodigo: 'BORRADOR', sucursalUuid: 'sucursal-1' }]
    });
    tick();

    httpMock.expectOne(`${bffApiUrl}/api/agendas/sucursal/sucursal-1`).flush({
      payload: [{ uuid: 'ag-1', estado: 'OCUPADO', observacion: 'Velatorio', tipoRecursoNombre: 'Sala', fechaHoraInicio: `${component.today}T10:00:00`, fechaHoraFin: `${component.today}T11:00:00` }]
    });
    httpMock.expectOne(request =>
      request.url === `${bffApiUrl}/api/inventario/stock`
      && request.params.get('sucursalUuid') === 'sucursal-1'
    ).flush({
      payload: [{ productoUuid: 'prod-1', productoCodigo: 'P1', productoNombre: 'Urna', unidadMedidaNombre: 'Unidad', stockActual: 0 }]
    });

    tick();

    expect(component.sucursales.length).toBe(1);
    expect(component.cotizacionesActivas.length).toBe(1);
    expect(component.agendaHoy.length).toBe(1);
    expect(component.alertasStock.length).toBe(1);
  }));

  afterEach(() => {
    httpMock.verify();
  });
});
