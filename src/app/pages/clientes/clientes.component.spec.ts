import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { ClientesComponent } from './clientes.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('ClientesComponent', () => {
  let component: ClientesComponent;
  let fixture: ComponentFixture<ClientesComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  const comuna = { id: 1, uuid: 'comuna-1', nombre: 'Santiago', region_id: 10 };
  const region = { id: 10, uuid: 'region-1', nombre: 'Metropolitana' };
  const empresa = { id: 1, uuid: 'empresa-1', razonSocial: 'Gesfun' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [ClientesComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(ClientesComponent);
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
    httpMock.expectOne(`${bffApiUrl}/api/comunas`).flush({ payload: [comuna] });
    httpMock.expectOne(`${bffApiUrl}/api/regiones`).flush({ payload: [region] });
    httpMock.expectOne(`${bffApiUrl}/api/empresas`).flush({ payload: [empresa] });
    await flushAsync();
  }

  it('should load catalogs and clients from BFF with CLIENTE role mapping', async () => {
    const pending = component.ngOnInit();
    await flushAsync();

    await flushCatalogos();
    httpMock.expectOne(`${bffApiUrl}/api/clientes`).flush({ payload: [{
      id: 8,
      uuid: 'cliente-1',
      rut: 16415933,
      dv: '5',
      nombreCompleto: 'Paz Cid Robles',
      email: 'paz@test.cl',
      telefono: '999',
      tipoPersona: 'N',
      activo: 1,
      comunaUuid: 'comuna-1',
      empresaUuid: 'empresa-1'
    }] });
    await pending;

    expect(component.clientes.length).toBe(1);
    expect(component.clientes[0].rol).toBe('CLIENTE');
    expect(component.clientes[0].activo).toBeTrue();
    expect(component.getComunaName(component.clientes[0].comuna_id)).toBe('Santiago');
  });

  it('should create clients through BFF using cliente endpoint payload', async () => {
    component.comunas = [comuna as any];
    component.empresas = [{ id: 1, uuid: 'empresa-1', razon_social: 'Gesfun' } as any];
    component.form = {
      tipo_persona: 'persona_natural',
      nombre_completo: 'Ana Perez Soto',
      ruc: '16415933',
      dv: '5',
      email: 'ana@test.cl',
      telefono: '123',
      comuna_id: 1,
      empresa_id: 1
    };

    const pending = component.save();
    await flushAsync();

    const post = httpMock.expectOne(`${bffApiUrl}/api/clientes`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(jasmine.objectContaining({
      tipoPersona: 'N',
      rut: 16415933,
      dv: '5',
      nombreCompleto: 'Ana Perez Soto',
      nombres: 'Ana Perez',
      apellidoPaterno: 'Soto',
      comunaUuid: 'comuna-1',
      empresaUuid: 'empresa-1'
    }));
    post.flush({ payload: { uuid: 'cliente-1' } });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/clientes`).flush({ payload: [] });
    await pending;

    expect(component.success).toBe('Cliente creado correctamente.');
    expect(component.formVisible).toBeFalse();
  });

  it('should deactivate clients through BFF and reload list', async () => {
    const cliente: any = { uuid: 'cliente-1', activo: true, nombre_completo: 'Ana Perez' };
    component.delete(cliente);

    const pending = component.confirmDeactivateCliente();
    await flushAsync();

    const patch = httpMock.expectOne(`${bffApiUrl}/api/clientes/cliente-1/desactivar`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush({});
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/clientes`).flush({ payload: [] });
    await pending;

    expect(component.success).toBe('Cliente desactivado correctamente.');
    expect(component.clientePendingDeactivate).toBeNull();
  });
});
