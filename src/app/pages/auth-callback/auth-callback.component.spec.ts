import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthCallbackComponent } from './auth-callback.component';
import { AuthService } from '../../services/auth.service';

describe('AuthCallbackComponent', () => {
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['handleRedirectResponse']);
    auth.handleRedirectResponse.and.resolveTo({ username: 'usuario@test.cl' } as any);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      declarations: [AuthCallbackComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
    fixture = TestBed.createComponent(AuthCallbackComponent);
  });

  it('should process the redirect response and return to login flow', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(auth.handleRedirectResponse).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
