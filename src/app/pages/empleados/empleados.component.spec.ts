import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmpleadosComponent } from './empleados.component';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';

describe('EmpleadosComponent', () => {
  let component: EmpleadosComponent;
  let fixture: ComponentFixture<EmpleadosComponent>;

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

  it('should reject inactive empleados', () => {
    component.edit({ ...empleado, activo: false });

    expect(component.error).toBe('No se puede editar un empleado desactivado.');
  });

  it('should validate required fields before saving', async () => {
    component.form = { nombre_completo: '', ruc: '', dv: '', email: '', telefono: '' };

    await component.save();

    expect(component.error).toBe('Completa nombre, RUT, email y telefono.');
  });
});
