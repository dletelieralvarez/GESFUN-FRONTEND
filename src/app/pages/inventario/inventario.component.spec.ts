import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { InventarioComponent } from './inventario.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';
import { bffApiUrl } from '../../auth-config';

describe('InventarioComponent', () => {
  let component: InventarioComponent;
  let fixture: ComponentFixture<InventarioComponent>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [InventarioComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(InventarioComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send one inventory entry with all product details', fakeAsync(() => {
    component.selectedSucursalUuid = 'sucursal-1';
    component.sucursales = [{ uuid: 'sucursal-1', codigo: 'S1', nombre: 'Central', activo: true }];
    component.tiposMovimiento = [{ uuid: 'tipo-entrada', codigo: 'ENT', nombre: 'Entrada', activo: true, tipoMvto: 'E' }];
    component.formasPago = [{ uuid: 'pago-1', codigo: 'CONT', nombre: 'Contado', activo: true }];
    component.proveedores = [{ uuid: 'proveedor-1', codigo: '', nombre: 'Proveedor', activo: true }];
    component.usuarios = [{ uuid: 'usuario-1', codigo: '', nombre: 'Usuario', activo: true }];
    component.productos = [
      { uuid: 'producto-1', codigo: 'P1', nombre: 'Urna', activo: true, precio: 100, categoria: 'Urnas', tipoItem: 'P', afecto: true },
      { uuid: 'producto-2', codigo: 'P2', nombre: 'Cirio', activo: true, precio: 50, categoria: 'Insumos', tipoItem: 'P', afecto: true }
    ];
    component.openEntrada();
    component.form.detalles = [
      { productoUuid: 'producto-1', cantidad: 3, costoUnitario: 100, descuento: 0, observacion: 'Primero' },
      { productoUuid: 'producto-2', cantidad: 4, costoUnitario: 50, descuento: 0, observacion: 'Segundo' }
    ];

    component.registrarEntrada();
    tick();

    const post = httpMock.expectOne(`${bffApiUrl}/api/inventario/entradas`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body.sucursalUuid).toBe('sucursal-1');
    expect(post.request.body.detalles.length).toBe(2);
    expect(post.request.body.detalles[1].productoUuid).toBe('producto-2');
    post.flush({ payload: { numMovimiento: 10 } });

    tick();
    const stock = httpMock.expectOne(request =>
      request.url === `${bffApiUrl}/api/inventario/stock`
      && request.params.get('sucursalUuid') === 'sucursal-1'
    );
    stock.flush({ payload: [] });
    tick();

    expect(component.success).toContain('10');
  }));

  afterEach(() => {
    httpMock.verify();
  });
});
