import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProveedoresComponent } from './proveedores.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';

describe('ProveedoresComponent', () => {
  let component: ProveedoresComponent;
  let fixture: ComponentFixture<ProveedoresComponent>;

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
});
