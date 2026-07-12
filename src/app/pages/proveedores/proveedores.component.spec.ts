import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ProveedoresComponent } from './proveedores.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('ProveedoresComponent', () => {
  let component: ProveedoresComponent;
  let fixture: ComponentFixture<ProveedoresComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  const proveedor: any = {
    id: 1,
    uuid: 'proveedor-uuid',
    rol: 'PROVEEDOR',
    nombre_completo: 'Servicios Ltda',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    razon_social: 'Servicios Ltda',
    ruc: '76543210',
    dv: '1',
    email: 'proveedor@test.cl',
    telefono: '456',
    tipo_persona: 'empresa',
    activo: true,
    region_id: 1,
    comuna_id: 1,
    empresa_id: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [ProveedoresComponent],
      providers: commonTestingProviders
    });

    fixture = TestBed.createComponent(ProveedoresComponent);
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
    expect(component.form.rol).toBe('PROVEEDOR');
  });

  it('should edit active proveedores', () => {
    component.edit(proveedor);

    expect(component.isEditing).toBeTrue();
    expect(component.selectedProveedor).toEqual(proveedor);
  });

  it('should clear comuna on edit when it does not belong to selected region', () => {
    component.comunas = [
      { id: 1, uuid: 'comuna-1', codigo: 'C1', nombre: 'Comuna 1', region_id: 1 },
      { id: 2, uuid: 'comuna-2', codigo: 'C2', nombre: 'Comuna 2', region_id: 2 }
    ];

    component.edit({ ...proveedor, region_id: 2, comuna_id: 1 });

    expect(component.form.region_id).toBe(2);
    expect(component.form.comuna_id).toBe(0);
  });

  it('should set pending deactivate for active proveedores', () => {
    component.delete(proveedor);

    expect(component.proveedorPendingDeactivate).toEqual(proveedor);
    expect(component.formVisible).toBeFalse();
  });

  it('should validate required fields before saving', async () => {
    component.form = { nombre_completo: '', ruc: '', dv: '', email: '', telefono: '' };

    await component.save();

    expect(component.error).toBe('Completa nombre, RUT, email y telefono.');
  });

  it('should reject oversized text fields before saving', async () => {
    component.form = {
      nombre_completo: 'A'.repeat(201),
      ruc: '76543210',
      dv: '1',
      email: 'proveedor@test.cl',
      telefono: '456',
      region_id: 1,
      comuna_id: 1,
      empresa_id: 1
    };

    await component.save();

    expect(component.error).toBe('El campo nombre completo / razon social no puede superar 200 caracteres.');
  });

  it('should reject non numeric RUT before saving', async () => {
    component.form = {
      nombre_completo: 'Servicios Ltda',
      ruc: '76A43210',
      dv: '1',
      email: 'proveedor@test.cl',
      telefono: '456',
      region_id: 1,
      comuna_id: 1,
      empresa_id: 1
    };

    await component.save();

    expect(component.error).toBe('El RUT / RUC debe contener solo numeros.');
  });

  it('should reject email without arroba before saving', async () => {
    component.form = {
      nombre_completo: 'Servicios Ltda',
      ruc: '76543210',
      dv: '1',
      email: 'proveedor.test.cl',
      telefono: '456',
      region_id: 1,
      comuna_id: 1,
      empresa_id: 1
    };

    await component.save();

    expect(component.error).toBe('Ingresa un email valido con arroba.');
  });

  it('should require an explicitly selected comuna before saving', async () => {
    component.form = {
      nombre_completo: 'Servicios Ltda',
      ruc: '76543210',
      dv: '1',
      email: 'proveedor@test.cl',
      telefono: '456',
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
      nombre_completo: 'Servicios Ltda',
      ruc: '76543210',
      dv: '1',
      email: 'proveedor@test.cl',
      telefono: '456',
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

    const message = (component as any).getErrorMessage(error, 'No se pudo guardar el proveedor.');

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

  it('should load proveedores from BFF with PROVEEDOR role mapping', async () => {
    const pending = component.ngOnInit();
    await flushAsync();

    await flushCatalogos();
    httpMock.expectOne(`${bffApiUrl}/api/proveedores`).flush({ payload: [{
      id: 5,
      uuid: 'proveedor-1',
      rut: 76543210,
      dv: '1',
      razonSocial: 'Servicios Ltda',
      nombreCompleto: 'Servicios Ltda',
      email: 'proveedor@test.cl',
      telefono: '456',
      tipoPersona: 'J',
      activo: 1,
      comunaUuid: 'comuna-1',
      empresaUuid: 'empresa-1'
    }] });
    await pending;

    expect(component.proveedores.length).toBe(1);
    expect(component.proveedores[0].rol).toBe('PROVEEDOR');
    expect(component.proveedores[0].tipo_persona).toBe('empresa');
  });

  it('should create proveedor through BFF as juridical person', async () => {
    component.comunas = [{ id: 1, uuid: 'comuna-1', nombre: 'Santiago', region_id: 10 } as any];
    component.empresas = [{ id: 1, uuid: 'empresa-1', razon_social: 'Gesfun' } as any];
    component.form = {
      tipo_persona: 'empresa',
      nombre_completo: 'Servicios Ltda',
      ruc: '76543210',
      dv: '1',
      email: 'proveedor@test.cl',
      telefono: '456',
      region_id: 10,
      comuna_id: 1,
      empresa_id: 1
    };

    const pending = component.save();
    await flushAsync();

    const post = httpMock.expectOne(`${bffApiUrl}/api/proveedores`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(jasmine.objectContaining({
      tipoPersona: 'J',
      rut: 76543210,
      nombreCompleto: 'Servicios Ltda',
      razonSocial: 'Servicios Ltda',
      comunaUuid: 'comuna-1',
      empresaUuid: 'empresa-1'
    }));
    post.flush({ payload: { uuid: 'proveedor-1' } });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/proveedores`).flush({ payload: [] });
    await pending;

    expect(component.success).toBe('Proveedor creado correctamente.');
    expect(component.formVisible).toBeFalse();
  });

  it('should deactivate proveedor through BFF', async () => {
    component.delete(proveedor);

    const pending = component.confirmDeactivateProveedor();
    await flushAsync();

    const patch = httpMock.expectOne(`${bffApiUrl}/api/proveedores/proveedor-uuid/desactivar`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush({});
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/proveedores`).flush({ payload: [] });
    await pending;

    expect(component.success).toBe('Proveedor desactivado correctamente.');
    expect(component.proveedorPendingDeactivate).toBeNull();
  });
});
