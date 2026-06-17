import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ProductosServiciosComponent } from './productos-servicios.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('ProductosServiciosComponent', () => {
  let component: ProductosServiciosComponent;
  let fixture: ComponentFixture<ProductosServiciosComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  const item: any = {
    id: 1,
    uuid: 'item-uuid',
    tipo_item: 'producto',
    codigo: 'ATA-001',
    nombre: 'Ataud',
    descripcion: 'Ataud base',
    precio: 1000,
    activo: true,
    afecto: true,
    unidad_medida_id: 1,
    empresa_id: 1,
    categoria: 'Ataudes'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [ProductosServiciosComponent],
      providers: commonTestingProviders
    });

    fixture = TestBed.createComponent(ProductosServiciosComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open a clean create form', () => {
    component.itemPendingDeactivate = item;

    component.openNew();

    expect(component.formVisible).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.itemPendingDeactivate).toBeNull();
    expect(component.form.tipo_item).toBe('producto');
  });

  it('should block editing inactive items', () => {
    component.edit({ ...item, activo: false });

    expect(component.formVisible).toBeFalse();
    expect(component.error).toBe('No se puede editar un producto o servicio desactivado.');
  });

  it('should mark an active item as pending deactivate', () => {
    component.delete(item);

    expect(component.itemPendingDeactivate).toEqual(item);
    expect(component.formVisible).toBeFalse();
  });

  it('should validate required fields before saving', async () => {
    component.form = { codigo: '', nombre: '', descripcion: '', precio: 0 };

    await component.save();

    expect(component.error).toBe('Completa codigo, nombre, descripcion y precio.');
    expect(component.saving).toBeFalse();
  });

  it('should load catalogos and productos servicios from BFF', async () => {
    const pending = component.ngOnInit();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/unidades-medida`).flush({ payload: [{ id: 1, uuid: 'unidad-uuid', codigo: 'UN', nombre: 'Unidad', activo: 1 }] });
    httpMock.expectOne(`${bffApiUrl}/api/empresas`).flush({ payload: [{ id: 1, uuid: 'empresa-uuid', rut: '1', dv: '9', razonSocial: 'Empresa' }] });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [{ ...item, tipoItem: 'P', unidadMedidaUuid: 'unidad-uuid', empresaUuid: 'empresa-uuid' }] });

    await pending;

    expect(component.unidadesMedida[0].uuid).toBe('unidad-uuid');
    expect(component.empresas[0].uuid).toBe('empresa-uuid');
    expect(component.items[0].nombre).toBe('Ataud');
  });

  it('should create a producto servicio with POST and reload list', async () => {
    component.unidadesMedida = [{ id: 1, uuid: 'unidad-uuid', codigo: 'UN', nombre: 'Unidad', activo: true }];
    component.empresas = [{ id: 1, uuid: 'empresa-uuid', rut: '1', dv: '9', razon_social: 'Empresa', activo: true, usuario_id: 1, comuna_id: 1, direccion: '' }];
    component.form = { ...item, uuid: '', id: 0 };

    const pending = component.save();
    await Promise.resolve();

    const post = httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body.tipoItem).toBe('P');
    expect(post.request.body.unidadMedidaUuid).toBe('unidad-uuid');
    expect(post.request.body.empresaUuid).toBe('empresa-uuid');
    post.flush({});

    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [item] });

    await pending;

    expect(component.success).toBe('Producto o servicio creado correctamente.');
    expect(component.formVisible).toBeFalse();
  });

  it('should deactivate an item with PATCH', async () => {
    component.itemPendingDeactivate = item;

    const pending = component.confirmDeactivateItem();
    await Promise.resolve();

    const patch = httpMock.expectOne(`${bffApiUrl}/api/productos-servicios/${item.uuid}/desactivar`);
    expect(patch.request.method).toBe('PATCH');
    patch.flush({});

    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [] });

    await pending;

    expect(component.success).toBe('Producto o servicio desactivado correctamente.');
    expect(component.itemPendingDeactivate).toBeNull();
  });

  it('should infer servicio type and category from API response', async () => {
    const pending = component.ngOnInit();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/api/unidades-medida`).flush({ payload: [] });
    httpMock.expectOne(`${bffApiUrl}/api/empresas`).flush({ payload: [] });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/productos-servicios`).flush({ payload: [{ uuid: 'srv', tipoItem: 'S', nombre: 'Servicio de cafe', descripcion: 'Cafe', precio: 10 }] });

    await pending;

    expect(component.items[0].tipo_item).toBe('servicio');
    expect(component.items[0].categoria).toBe('Cafeteria');
  });
});
