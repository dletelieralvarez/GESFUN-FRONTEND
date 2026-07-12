import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { UsuariosComponent } from './usuarios.component';
import { bffApiUrl } from '../../auth-config';
import { commonTestingImports, commonTestingProviders } from '../../testing/test-bed-utils';

describe('UsuariosComponent', () => {
  let component: UsuariosComponent;
  let fixture: ComponentFixture<UsuariosComponent>;
  let httpMock: HttpTestingController;
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [UsuariosComponent],
      providers: commonTestingProviders
    });
    fixture = TestBed.createComponent(UsuariosComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  async function flushLoadUsers(users: any[]) {
    httpMock.expectOne(`${bffApiUrl}/bff/me`).flush({ email: 'test@gesfun.cl' });
    await flushAsync();
    httpMock.expectOne(`${bffApiUrl}/api/usuarios`).flush({ payload: users });
    await flushAsync();
  }

  it('should load users after validating the session', async () => {
    fixture.detectChanges();
    await Promise.resolve();

    await flushLoadUsers([
      {
        id: 1,
        uuid: 'usuario-1',
        email: 'ana@example.cl',
        nombre: 'Ana',
        paterno: 'Perez',
        materno: 'Soto',
        activo: 1,
        roles: 'ADMIN',
        tipoUsuario: 'ADMIN'
      }
    ]);
    await fixture.whenStable();

    expect(component.users.length).toBe(1);
    expect(component.users[0].activo).toBeTrue();
    expect(component.tokenInfo?.meStatus).toBe('OK');
  });

  it('should create users and reload list', async () => {
    component.openCreate();
    component.userForm = {
      id: 1,
      uuid: 'usuario-1',
      email: 'ana@example.cl',
      nombre: 'Ana',
      paterno: 'Perez',
      materno: 'Soto',
      activo: true,
      roles: 'USER',
      tipoUsuario: 'USUARIO'
    };

    const action = component.saveUser();
    await Promise.resolve();

    const post = httpMock.expectOne(`${bffApiUrl}/api/usuarios`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(jasmine.objectContaining({
      uuid: 'usuario-1',
      email: 'ana@example.cl',
      activo: 1,
      roles: 'USER',
      tipoUsuario: 'USUARIO'
    }));
    expect(post.request.body.id).toBeUndefined();
    post.flush({ payload: { uuid: 'usuario-1' } });
    await flushAsync();

    await flushLoadUsers([]);
    await action;

    expect(component.success).toBe('Usuario creado correctamente.');
    expect(component.formOpen).toBeFalse();
  });

  it('should update users including id in payload', async () => {
    component.users = [{
      id: 7,
      uuid: 'usuario-7',
      email: 'ana@example.cl',
      nombre: 'Ana',
      paterno: 'Perez',
      materno: 'Soto',
      activo: true,
      roles: 'USER',
      tipoUsuario: 'USUARIO'
    }];
    component.openEdit(0);
    component.userForm.roles = 'ADMIN';

    const action = component.saveUser();
    await Promise.resolve();

    const put = httpMock.expectOne(`${bffApiUrl}/api/usuarios/7`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(jasmine.objectContaining({
      id: 7,
      uuid: 'usuario-7',
      roles: 'ADMIN'
    }));
    put.flush({ payload: { uuid: 'usuario-7' } });
    await flushAsync();

    await flushLoadUsers([]);
    await action;

    expect(component.success).toBe('Usuario actualizado correctamente.');
  });

  it('should delete users and reload list', async () => {
    component.users = [{
      id: 7,
      uuid: 'usuario-7',
      email: 'ana@example.cl',
      nombre: 'Ana',
      paterno: 'Perez',
      materno: 'Soto',
      activo: true,
      roles: 'USER',
      tipoUsuario: 'USUARIO'
    }];
    component.deleteUser(0);

    const action = component.confirmDeleteUser();
    await Promise.resolve();

    const del = httpMock.expectOne(`${bffApiUrl}/api/usuarios/7`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null, { status: 204, statusText: 'No Content' });
    await flushAsync();

    await flushLoadUsers([]);
    await action;

    expect(component.success).toBe('Usuario eliminado correctamente.');
    expect(component.userPendingDelete).toBeNull();
  });

  it('should show a user friendly session message when validation returns 401', async () => {
    fixture.detectChanges();
    await Promise.resolve();

    httpMock.expectOne(`${bffApiUrl}/bff/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    await flushAsync();
    await fixture.whenStable();

    expect(component.error).toBe('Su sesion ha expirado. Inicie sesion nuevamente.');
    expect(component.error).not.toContain('BFF');
    expect(component.error).not.toContain('/bff/me');
  });
});
