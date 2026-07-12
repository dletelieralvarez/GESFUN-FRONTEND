import { firstValueFrom, of, throwError } from 'rxjs';
import { HttpErrorResponse, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  const createHandler = () => {
    let handledRequest: HttpRequest<any> | null = null;
    const handler: HttpHandler = {
      handle: (req: HttpRequest<any>) => {
        handledRequest = req;
        return of(new HttpResponse({ status: 200 }));
      }
    };
    return { handler, get handledRequest() { return handledRequest; } };
  };

  it('should not add authorization header for non system urls', async () => {
    const auth: any = {
      API_URL: '/api',
      BFF_URL: '',
      getAccessToken: jasmine.createSpy('getAccessToken')
    };
    const interceptor = new AuthInterceptor(auth);
    const wrapped = createHandler();

    await firstValueFrom(interceptor.intercept(new HttpRequest('GET', 'https://example.com/api'), wrapped.handler));

    expect(auth.getAccessToken).not.toHaveBeenCalled();
    expect(wrapped.handledRequest?.headers.has('Authorization')).toBeFalse();
  });

  it('should add authorization header for relative API urls', async () => {
    const auth: any = {
      API_URL: '/api',
      BFF_URL: '',
      getAccessToken: () => Promise.resolve('token-123')
    };
    const interceptor = new AuthInterceptor(auth);
    const wrapped = createHandler();

    await firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/api/me'), wrapped.handler));

    expect(wrapped.handledRequest?.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('should add authorization header for local development API urls', async () => {
    const auth: any = {
      API_URL: 'http://localhost:8080/api',
      BFF_URL: 'http://localhost:8080',
      getAccessToken: () => Promise.resolve('token-123')
    };
    const interceptor = new AuthInterceptor(auth);
    const wrapped = createHandler();

    await firstValueFrom(interceptor.intercept(new HttpRequest('GET', 'http://localhost:8080/api/me'), wrapped.handler));

    expect(wrapped.handledRequest?.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('should not send the request when token retrieval fails', async () => {
    const auth: any = {
      API_URL: '/api',
      BFF_URL: '',
      getAccessToken: () => Promise.reject(new Error('boom'))
    };
    const interceptor = new AuthInterceptor(auth);
    const wrapped = createHandler();

    await expectAsync(
      firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/api/me'), wrapped.handler))
    ).toBeRejectedWithError('boom');

    expect(wrapped.handledRequest).toBeNull();
  });

  it('should mark session as expired when the system returns 401', async () => {
    const auth: any = {
      API_URL: '/api',
      BFF_URL: '',
      getAccessToken: () => Promise.resolve('token-123'),
      handleSessionExpired: jasmine.createSpy('handleSessionExpired').and.resolveTo(undefined)
    };
    const interceptor = new AuthInterceptor(auth);
    const handler: HttpHandler = {
      handle: () => throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
    };

    await expectAsync(
      firstValueFrom(interceptor.intercept(new HttpRequest('GET', '/api/me'), handler))
    ).toBeRejected();

    expect(auth.handleSessionExpired).toHaveBeenCalled();
  });
});
