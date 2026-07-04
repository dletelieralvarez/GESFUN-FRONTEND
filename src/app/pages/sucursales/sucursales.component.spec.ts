import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { SucursalesComponent } from './sucursales.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('SucursalesComponent', () => {
  let component: SucursalesComponent;
  let fixture: ComponentFixture<SucursalesComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  const sucursal: any = {
    id: 1,
    uuid: 'sucursal-uuid',
    codigo: 'SUC-001',
    nombre: 'Casa matriz',
    direccion: 'Principal 123',
    telefono: '123',
    activo: true,
    empresa_id: 1,
    comuna_id: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [SucursalesComponent],
      providers: commonTestingProviders
    });

    fixture = TestBed.createComponent(SucursalesComponent);
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
  });

  it('should edit active sucursales', () => {
    component.edit(sucursal);

    expect(component.isEditing).toBeTrue();
    expect(component.selectedSucursal).toEqual(sucursal);
    expect(component.form.nombre).toBe('Casa matriz');
  });

  it('should reject inactive sucursales', () => {
    component.edit({ ...sucursal, activo: false });

    expect(component.error).toBe('No se puede editar una sucursal desactivada.');
  });

  it('should validate required fields before saving', async () => {
    component.form = { codigo: '', nombre: '', direccion: '', telefono: '' };

    await component.save();

    expect(component.error).toBe('Completa codigo, nombre, direccion y telefono.');
  });

  it('should load catalogos and sucursales from BFF', async () => {
    const pending = component.ngOnInit();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/comunas`).flush({ payload: [{ id: 10, uuid: 'comuna-uuid', codigo: 'COM', nombre: 'Ñuñoa', regionId: 1 }] });
    httpMock.expectOne(`${bffApiUrl}/api/regiones`).flush({ payload: [{ id: 1, uuid: 'region-uuid', codigo: 'RM', nombre: 'Metropolitana' }] });
    httpMock.expectOne(`${bffApiUrl}/api/empresas`).flush({ payload: [{ id: 20, uuid: 'empresa-uuid', rut: '1', dv: '9', razonSocial: 'Empresa Test' }] });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).flush({ payload: [{ ...sucursal, comunaUuid: 'comuna-uuid', empresaUuid: 'empresa-uuid' }] });

    await pending;

    expect(component.comunas[0].uuid).toBe('comuna-uuid');
    expect(component.empresas[0].uuid).toBe('empresa-uuid');
    expect(component.sucursales[0].nombre).toBe('Casa matriz');
  });

  it('should create a sucursal with POST and reload list', async () => {
    component.comunas = [{ id: 1, uuid: 'comuna-uuid', codigo: 'COM', nombre: 'Ñuñoa', region_id: 1 }];
    component.empresas = [{ id: 1, uuid: 'empresa-uuid', rut: '1', dv: '9', razon_social: 'Empresa', activo: true, usuario_id: 1, comuna_id: 1, direccion: '' }];
    component.form = { codigo: 'SUC-002', nombre: 'Sucursal norte', direccion: 'Norte 123', telefono: '999', comuna_id: 1, empresa_id: 1, activo: true };

    const pending = component.save();
    await Promise.resolve();

    const post = httpMock.expectOne(`${bffApiUrl}/api/sucursales`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body.comunaUuid).toBe('comuna-uuid');
    expect(post.request.body.empresaUuid).toBe('empresa-uuid');
    post.flush({});

    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).flush({ payload: [sucursal] });

    await pending;

    expect(component.success).toBe('Sucursal creada correctamente.');
    expect(component.formVisible).toBeFalse();
  });

  it('should deactivate a sucursal with PATCH', async () => {
    component.sucursalPendingDeactivate = sucursal;

    const pending = component.confirmDeactivateSucursal();
    await Promise.resolve();

    const patch = httpMock.expectOne(`${bffApiUrl}/api/sucursales/${sucursal.uuid}/desactivar`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush({});

    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).flush({ payload: [] });

    await pending;

    expect(component.success).toBe('Sucursal desactivada correctamente.');
    expect(component.sucursalPendingDeactivate).toBeNull();
  });

  it('should show connection error when loading sucursales fails with status 0', async () => {
    const pending = component.ngOnInit();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/comunas`).flush({ payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/regiones`).flush({ payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/empresas`).flush({ payload: [] });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/sucursales`).error(new ProgressEvent('error'), { status: 0 });

    await pending;

    expect(component.error).toBe('No se pudo conectar con el servidor. Verifica que el BFF esté disponible.');
  });
});
