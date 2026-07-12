import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { EmpleadosComponent } from './empleados.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('EmpleadosComponent', () => {
  let component: EmpleadosComponent;
  let fixture: ComponentFixture<EmpleadosComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  const empleado: any = {
    id: 1,
    uuid: 'empleado-uuid',
    rol: 'EMPLEADO',
    nombre_completo: 'Ana Perez',
    nombres: 'Ana',
    apellido_paterno: 'Perez',
    apellido_materno: '',
    ruc: '12345678',
    dv: '9',
    email: 'ana@test.cl',
    telefono: '123',
    tipo_persona: 'persona_natural',
    activo: true,
    region_id: 1,
    comuna_id: 1,
    empresa_id: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [EmpleadosComponent],
      providers: commonTestingProviders
    });

    fixture = TestBed.createComponent(EmpleadosComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open create mode', () => {
    component.openNew();

    expect(component.formVisible).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.form.rol).toBe('EMPLEADO');
  });

  it('should edit active empleados', () => {
    component.edit(empleado);

    expect(component.isEditing).toBeTrue();
    expect(component.selectedEmpleado).toEqual(empleado);
    expect(component.form.nombre_completo).toBe('Ana Perez');
  });

  it('should clear comuna on edit when it does not belong to selected region', () => {
    component.comunas = [
      { id: 1, uuid: 'comuna-1', codigo: 'C1', nombre: 'Comuna 1', region_id: 1 },
      { id: 2, uuid: 'comuna-2', codigo: 'C2', nombre: 'Comuna 2', region_id: 2 }
    ];

    component.edit({ ...empleado, region_id: 2, comuna_id: 1 });

    expect(component.form.region_id).toBe(2);
    expect(component.form.comuna_id).toBe(0);
  });

  it('should reject inactive empleados', () => {
    component.edit({ ...empleado, activo: false });

    expect(component.error).toBe('No se puede editar un empleado desactivado.');
  });

  it('should validate required fields before saving', async () => {
    component.form = { nombre_completo: '', ruc: '', dv: '', email: '', telefono: '' };

    await component.save();

    expect(component.error).toBe('Completa nombre, RUT, email y telefono.');
  });

  it('should reject oversized text fields before saving', async () => {
    component.form = {
      nombre_completo: 'A'.repeat(201),
      ruc: '12345678',
      dv: '9',
      email: 'ana@test.cl',
      telefono: '123',
      region_id: 1,
      comuna_id: 1,
      empresa_id: 1
    };

    await component.save();

    expect(component.error).toBe('El campo nombre completo no puede superar 200 caracteres.');
  });

  it('should reject non numeric RUT before saving', async () => {
    component.form = {
      nombre_completo: 'Ana Perez',
      ruc: '12A45678',
      dv: '9',
      email: 'ana@test.cl',
      telefono: '123',
      region_id: 1,
      comuna_id: 1,
      empresa_id: 1
    };

    await component.save();

    expect(component.error).toBe('El RUT / RUC debe contener solo numeros.');
  });

  it('should reject email without arroba before saving', async () => {
    component.form = {
      nombre_completo: 'Ana Perez',
      ruc: '12345678',
      dv: '9',
      email: 'ana.test.cl',
      telefono: '123',
      region_id: 1,
      comuna_id: 1,
      empresa_id: 1
    };

    await component.save();

    expect(component.error).toBe('Ingresa un email valido con arroba.');
  });

  it('should require an explicitly selected comuna before saving', async () => {
    component.form = {
      nombre_completo: 'Ana Perez',
      ruc: '12345678',
      dv: '9',
      email: 'ana@test.cl',
      telefono: '123',
      region_id: 1,
      comuna_id: 0,
      empresa_id: 1
    };

    await component.save();

    expect(component.error).toBe('Selecciona region, comuna y empresa.');
  });

  it('should reject comuna from another region before saving', async () => {
    component.comunas = [
      { id: 1, uuid: 'comuna-1', codigo: 'C1', nombre: 'Comuna 1', region_id: 1 },
      { id: 2, uuid: 'comuna-2', codigo: 'C2', nombre: 'Comuna 2', region_id: 2 }
    ];
    component.form = {
      nombre_completo: 'Ana Perez',
      ruc: '12345678',
      dv: '9',
      email: 'ana@test.cl',
      telefono: '123',
      region_id: 2,
      comuna_id: 1,
      empresa_id: 1
    };

    await component.save();

    expect(component.error).toBe('Selecciona una comuna valida para la region.');
  });

  it('should filter comunas when region changes', () => {
    component.regiones = [
      { id: 1, uuid: 'region-1', codigo: 'R1', nombre: 'Region 1' },
      { id: 2, uuid: 'region-2', codigo: 'R2', nombre: 'Region 2' }
    ];
    component.comunas = [
      { id: 1, uuid: 'comuna-1', codigo: 'C1', nombre: 'Comuna 1', region_id: 1 },
      { id: 2, uuid: 'comuna-2', codigo: 'C2', nombre: 'Comuna 2', region_id: 2 }
    ];
    component.form = { region_id: 2, comuna_id: 1 };

    component.onRegionChange();

    expect(component.comunasFiltradas.map(comuna => comuna.nombre)).toEqual(['Comuna 2']);
    expect(component.form.comuna_id).toBe(0);
  });

  it('should sanitize backend messages with embedded JSON', () => {
    const error = {
      error: {
        message: 'Error al procesar la petición en el servicio de backend. { "status" : 400, "error" : "Bad Request", "message" : "La empresa ya tiene registrado un tercero con el rut indicado.", "path" : "/api/terceros" }'
      }
    };

    const message = (component as any).getErrorMessage(error, 'No se pudo guardar el empleado.');

    expect(message).toBe('La empresa ya tiene registrado un tercero con el rut indicado.');
  });

  async function flushCatalogos() {
    httpMock.expectOne(`${bffApiUrl}/api/comunas`).flush({ payload: [
      { id: 1, uuid: 'comuna-1', nombre: 'Santiago', region_id: 10 }
    ] });
    httpMock.expectOne(`${bffApiUrl}/api/regiones`).flush({ payload: [
      { id: 10, uuid: 'region-1', nombre: 'Metropolitana' }
    ] });
    httpMock.expectOne(`${bffApiUrl}/api/empresas`).flush({ payload: [
      { id: 1, uuid: 'empresa-1', razonSocial: 'Gesfun' }
    ] });
    await flushAsync();
  }

  it('should load empleados from BFF with EMPLEADO role mapping', async () => {
    const pending = component.ngOnInit();
    await flushAsync();

    await flushCatalogos();
    httpMock.expectOne(`${bffApiUrl}/api/empleados`).flush({ payload: [{
      id: 7,
      uuid: 'empleado-1',
      rut: 11111111,
      dv: '1',
      nombreCompleto: 'Empleado Test',
      email: 'empleado@test.cl',
      telefono: '123',
      tipoPersona: 'N',
      activo: 1,
      comunaUuid: 'comuna-1',
      empresaUuid: 'empresa-1'
    }] });
    await pending;

    expect(component.empleados.length).toBe(1);
    expect(component.empleados[0].rol).toBe('EMPLEADO');
    expect(component.empleados[0].activo).toBeTrue();
  });

  it('should create empleado through BFF and reload list', async () => {
    component.comunas = [{ id: 1, uuid: 'comuna-1', nombre: 'Santiago', region_id: 10 } as any];
    component.empresas = [{ id: 1, uuid: 'empresa-1', razon_social: 'Gesfun' } as any];
    component.form = {
      nombre_completo: 'Ana Perez Soto',
      ruc: '12345678',
      dv: '9',
      email: 'ana@test.cl',
      telefono: '123',
      region_id: 10,
      comuna_id: 1,
      empresa_id: 1
    };

    const pending = component.save();
    await flushAsync();

    const post = httpMock.expectOne(`${bffApiUrl}/api/empleados`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(jasmine.objectContaining({
      tipoPersona: 'N',
      rut: 12345678,
      nombreCompleto: 'Ana Perez Soto',
      nombres: 'Ana Perez',
      apellidoPaterno: 'Soto',
      comunaUuid: 'comuna-1',
      empresaUuid: 'empresa-1'
    }));
    post.flush({ payload: { uuid: 'empleado-1' } });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/empleados`).flush({ payload: [] });
    await pending;

    expect(component.success).toBe('Empleado creado correctamente.');
    expect(component.formVisible).toBeFalse();
  });

  it('should deactivate empleado through BFF', async () => {
    component.delete(empleado);

    const pending = component.confirmDeleteEmpleado();
    await flushAsync();

    const patch = httpMock.expectOne(`${bffApiUrl}/api/empleados/empleado-uuid/desactivar`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush({});
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/empleados`).flush({ payload: [] });
    await pending;

    expect(component.success).toBe('Empleado desactivado correctamente.');
    expect(component.empleadoPendingDelete).toBeNull();
  });
});
