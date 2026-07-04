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

  it('should not add authorization header for non BFF urls', async () => {
    const auth: any = { BFF_URL: 'http://localhost:8081', getAccessToken: jasmine.createSpy('getAccessToken') };
    const interceptor = new AuthInterceptor(auth);
    const wrapped = createHandler();

    await firstValueFrom(interceptor.intercept(new HttpRequest('GET', 'https://example.com/api'), wrapped.handler));

    expect(auth.getAccessToken).not.toHaveBeenCalled();
    expect(wrapped.handledRequest?.headers.has('Authorization')).toBeFalse();
  });

  it('should add authorization header for BFF urls', async () => {
    const auth: any = { BFF_URL: 'http://localhost:8081', getAccessToken: () => Promise.resolve('token-123') };
    const interceptor = new AuthInterceptor(auth);
    const wrapped = createHandler();

    await firstValueFrom(interceptor.intercept(new HttpRequest('GET', 'http://localhost:8081/api/me'), wrapped.handler));

    expect(wrapped.handledRequest?.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('should not send the request when token retrieval fails', async () => {
    const auth: any = { BFF_URL: 'http://localhost:8081', getAccessToken: () => Promise.reject(new Error('boom')) };
    const interceptor = new AuthInterceptor(auth);
    const wrapped = createHandler();

    await expectAsync(
      firstValueFrom(interceptor.intercept(new HttpRequest('GET', 'http://localhost:8081/api/me'), wrapped.handler))
    ).toBeRejectedWithError('boom');

    expect(wrapped.handledRequest).toBeNull();
  });

  it('should mark session as expired when the BFF returns 401', async () => {
    const auth: any = {
      BFF_URL: 'http://localhost:8081',
      getAccessToken: () => Promise.resolve('token-123'),
      handleSessionExpired: jasmine.createSpy('handleSessionExpired').and.resolveTo(undefined)
    };
    const interceptor = new AuthInterceptor(auth);
    const handler: HttpHandler = {
      handle: () => throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
    };

    await expectAsync(
      firstValueFrom(interceptor.intercept(new HttpRequest('GET', 'http://localhost:8081/api/me'), handler))
    ).toBeRejected();

    expect(auth.handleSessionExpired).toHaveBeenCalled();
  });
});
