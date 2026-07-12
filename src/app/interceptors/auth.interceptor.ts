import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { from, throwError } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const isApiRequest = req.url.startsWith(this.auth.API_URL)
      || (!!this.auth.BFF_URL && req.url.startsWith(this.auth.BFF_URL));

    if (!isApiRequest) {
      return next.handle(req);
    }

    return from(this.auth.getAccessToken()).pipe(
      mergeMap(token => {
        const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
        this.logRequest(authReq);
        return next.handle(authReq);
      }),
      catchError(error => {
        this.logError(req, error);
        if (error?.status === 401) {
          return from(this.auth.handleSessionExpired()).pipe(
            mergeMap(() => throwError(() => error))
          );
        }
        return throwError(() => error);
      })
    );
  }

  private logRequest(req: HttpRequest<any>) {
    if (!this.isCotizacionesRequest(req.url)) return;
    console.info('Peticion interceptada', {
      method: req.method,
      url: req.url,
      tieneAuthorization: req.headers.has('Authorization')
    });
  }

  private logError(req: HttpRequest<any>, error: unknown) {
    if (!(error instanceof HttpErrorResponse)) return;
    console.error('HTTP error', {
      method: req.method,
      url: error.url || req.url,
      status: error.status,
      message: error.message,
      body: error.error
    });
  }

  private isCotizacionesRequest(url: string) {
    return url.includes('/api/cotizaciones');
  }
}
