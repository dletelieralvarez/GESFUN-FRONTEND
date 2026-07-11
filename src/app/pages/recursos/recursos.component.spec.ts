import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { RecursosComponent } from './recursos.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('RecursosComponent', () => {
  let component: RecursosComponent;
  let fixture: ComponentFixture<RecursosComponent>;
  let httpMock: HttpTestingController;

  const sucursal = {
    id: 1,
    uuid: 'sucursal-uuid',
    codigo: 'SUC',
    nombre: 'Casa matriz',
    direccion: 'Principal 123',
    telefono: '123',
    activo: 1,
    empresa_id: 1,
    comuna_id: 1
  };

  const recurso = {
    id: 1,
    uuid: 'recurso-uuid',
    codigo: 'CAPILLA',
    nombre: 'Capilla',
    activo: 1,
    sucursalUuid: 'sucursal-uuid'
  };

  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [RecursosComponent],
      providers: commonTestingProviders
    });

    fixture = TestBed.createComponent(RecursosComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load sucursales and recursos from the BFF', async () => {
    const pending = component.ngOnInit();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).flush({ payload: [sucursal] });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/tipos-recurso`).flush({ payload: [recurso] });

    await pending;

    expect(component.sucursales.length).toBe(1);
    expect(component.recursos.length).toBe(1);
    expect(component.recursos[0].nombre).toBe('Capilla');
    expect(component.recursos[0].activo).toBeTrue();
  });

  it('should validate required fields before saving', async () => {
    component.form = { codigo: '', nombre: '', sucursalUuid: 'sucursal-uuid' };

    await component.save();

    expect(component.error).toBe('Completa codigo y nombre.');
    expect(component.saving).toBeFalse();
  });

  it('should reject oversized code before saving', async () => {
    component.form = {
      codigo: 'A'.repeat(31),
      nombre: 'Capilla',
      activo: true,
      sucursalUuid: 'sucursal-uuid'
    };

    await component.save();

    expect(component.error).toBe('El campo código no puede superar 30 caracteres.');
  });

  it('should reject oversized name before saving', async () => {
    component.form = {
      codigo: 'CAPILLA',
      nombre: 'A'.repeat(121),
      activo: true,
      sucursalUuid: 'sucursal-uuid'
    };

    await component.save();

    expect(component.error).toBe('El campo nombre no puede superar 120 caracteres.');
  });

  it('should reject invalid code characters before saving', async () => {
    component.form = {
      codigo: 'CAP ILLA',
      nombre: 'Capilla',
      activo: true,
      sucursalUuid: 'sucursal-uuid'
    };

    await component.save();

    expect(component.error).toBe('El código solo puede contener letras, números, guion y guion bajo.');
  });

  it('should create a recurso with POST and reload the list', async () => {
    component.sucursales = [{ ...sucursal, activo: true }];
    component.form = {
      codigo: 'VEL',
      nombre: 'Sala velatoria',
      activo: true,
      sucursalUuid: 'sucursal-uuid'
    };

    const pending = component.save();
    await Promise.resolve();

    const post = httpMock.expectOne(`${bffApiUrl}/api/tipos-recurso`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      codigo: 'VEL',
      nombre: 'Sala velatoria',
      activo: 1,
      sucursalUuid: 'sucursal-uuid'
    });
    post.flush({ payload: { uuid: 'new-resource' } });

    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/tipos-recurso`).flush({ payload: [recurso] });

    await pending;

    expect(component.success).toBe('Recurso creado correctamente.');
    expect(component.formVisible).toBeFalse();
  });

  it('should deactivate a recurso using PUT activo 0', async () => {
    component.recursoPendingDelete = {
      id: 1,
      uuid: 'recurso-uuid',
      codigo: 'CAPILLA',
      nombre: 'Capilla',
      activo: true,
      sucursalUuid: 'sucursal-uuid'
    };

    const pending = component.confirmDeleteRecurso();
    await Promise.resolve();

    const put = httpMock.expectOne(`${bffApiUrl}/api/tipos-recurso/recurso-uuid`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.activo).toBe(0);
    put.flush({});

    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/tipos-recurso`).flush({ payload: [] });

    await pending;

    expect(component.success).toBe('Recurso desactivado correctamente.');
    expect(component.recursoPendingDelete).toBeNull();
  });

  it('should sanitize backend messages with embedded JSON', () => {
    const error = {
      error: {
        message: 'Error al procesar la petición en el servicio de backend. { "status" : 400, "message" : "Ya existe un recurso con el codigo indicado." }'
      }
    };

    const message = (component as any).getErrorMessage(error, 'No se pudo guardar el recurso.');

    expect(message).toBe('Ya existe un recurso con el codigo indicado.');
  });
});
