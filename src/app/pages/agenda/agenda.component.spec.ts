import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { AgendaComponent } from './agenda.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('AgendaComponent', () => {
  let component: AgendaComponent;
  let fixture: ComponentFixture<AgendaComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [AgendaComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(AgendaComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send an agenda reservation payload to the BFF', fakeAsync(() => {
    component.selectedSucursalUuid = 'sucursal-1';
    component.sucursales = [{ uuid: 'sucursal-1', codigo: 'S1', nombre: 'Central', activo: true }];
    component.tiposRecurso = [{ uuid: 'tipo-velatorio', codigo: 'VEL', nombre: 'Sala de velatorio', activo: true }];
    component.cotizaciones = [{ uuid: 'cotizacion-1', codigo: '10', nombre: 'Cotización 10', activo: true }];
    component.openReserva();
    component.form.fechaInicio = '2026-06-25';
    component.form.fechaTermino = '2026-06-26';
    component.form.horaInicio = '18:00';
    component.form.horaFin = '09:00';
    component.form.observacion = 'Velatorio familia Soto';

    component.registrarAgenda();
    tick();

    const post = httpMock.expectOne(`${bffApiUrl}/api/agendas`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      fechaHoraInicio: '2026-06-25T18:00:00',
      fechaHoraFin: '2026-06-26T09:00:00',
      estado: 'OCUPADO',
      observacion: 'Velatorio familia Soto',
      tipoRecursoUuid: 'tipo-velatorio',
      sucursalUuid: 'sucursal-1',
      cotizacionUuid: 'cotizacion-1'
    });
    post.flush({ payload: { uuid: 'agenda-1' } });

    tick();
    const refresh = httpMock.expectOne(`${bffApiUrl}/api/agendas/sucursal/sucursal-1`);
    refresh.flush({ payload: [] });
    tick();

    expect(component.success).toContain('Servicio agendado correctamente');
  }));

  it('should use only backend-supported states in the reservation form', () => {
    component.openReserva();

    expect(['OCUPADO', 'DISPONIBLE']).toContain(component.form.estado);
  });

  afterEach(() => {
    httpMock.verify();
  });
});
