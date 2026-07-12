import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { bffApiUrl } from '../../auth-config';
import { commonTestingImports } from '../../testing/test-bed-utils';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  const account: any = { username: 'ana@example.cl', name: 'Ana Perez Soto' };
  const flushAsync = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'hasSessionExpired',
      'handleRedirectResponse',
      'getActiveAccount',
      'getAccessToken',
      'login',
      'logout'
    ]);
    auth.hasSessionExpired.and.returnValue(false);
    auth.handleRedirectResponse.and.resolveTo(account);
    auth.getActiveAccount.and.returnValue(account);
    auth.getAccessToken.and.resolveTo('test-token');
    auth.login.and.resolveTo();
    auth.logout.and.resolveTo();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      imports: commonTestingImports,
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should navigate to dashboard when the authenticated user exists in backend', async () => {
    fixture.detectChanges();
    await flushAsync();

    httpMock.expectOne(`${bffApiUrl}/api/usuarios`).flush({ payload: [
      { email: 'ana@example.cl' }
    ] });
    await flushAsync();
    await fixture.whenStable();

    expect(component.showMissingUserModal).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show missing user modal and create backend user with USER role', async () => {
    fixture.detectChanges();
    await flushAsync();

    httpMock.expectOne(`${bffApiUrl}/api/usuarios`).flush({ payload: [] });
    await flushAsync();
    await fixture.whenStable();

    expect(component.showMissingUserModal).toBeTrue();
    expect(component.pendingAccount?.username).toBe('ana@example.cl');

    const action = component.confirmCreateUser();
    await flushAsync();

    const post = httpMock.expectOne(`${bffApiUrl}/api/usuarios`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(jasmine.objectContaining({
      email: 'ana@example.cl',
      nombre: 'Ana',
      paterno: 'Perez',
      materno: 'Soto',
      activo: 1,
      roles: 'USER',
      tipoUsuario: 'USUARIO'
    }));
    post.flush({ payload: { uuid: 'usuario-1' } });
    await action;

    expect(component.showMissingUserModal).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should avoid interactive login while initializing', async () => {
    component.initializing = true;

    await component.login();

    expect(auth.login).not.toHaveBeenCalled();
  });
});
