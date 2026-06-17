import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanesComponent } from './planes.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';

describe('PlanesComponent', () => {
  let component: PlanesComponent;
  let fixture: ComponentFixture<PlanesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [PlanesComponent],
      providers: commonTestingProviders
    });

    fixture = TestBed.createComponent(PlanesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add and merge kit items', () => {
    const producto = component.productosServicios[0];
    component.form = { kit: [] };
    component.selectedProductoServicioId = producto.id;
    component.selectedCantidad = 2;

    component.addKitItem();
    component.selectedCantidad = 3;
    component.addKitItem();

    expect(component.form.kit?.length).toBe(1);
    expect(component.form.kit?.[0].cantidad).toBe(5);
    expect(component.kitTotal).toBe(producto.precio * 5);
  });

  it('should remove kit items and recalculate total', () => {
    const producto = component.productosServicios[0];
    component.form = {
      kit: [{
        producto_servicio_id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        tipo_item: producto.tipo_item,
        cantidad: 1,
        unitario: producto.precio,
        total: producto.precio
      }]
    };

    component.removeKitItem(producto.id);

    expect(component.form.kit).toEqual([]);
    expect(component.form.valor).toBe(0);
  });

  it('should validate required plan fields before saving', async () => {
    component.form = { nombre: '', descripcion: '', sucursal_id: 1, kit: [] };

    await component.save();

    expect(component.error).toBe('Completa nombre, descripcion, sucursal y agrega al menos un producto o servicio.');
  });

  it('should reject editing inactive plans', () => {
    const plan = { ...component.planes[0], activo: false };

    component.edit(plan);

    expect(component.error).toBe('No se puede editar un plan desactivado.');
    expect(component.formVisible).toBeFalse();
  });
});
