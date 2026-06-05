import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { from } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (!req.url.startsWith(this.auth.BFF_URL)) {
      return next.handle(req);
    }

    return from(this.auth.getAccessToken()).pipe(
      mergeMap(token => {
        const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
        return next.handle(authReq);
      }),
      catchError(() => next.handle(req))
    );
  }
}
