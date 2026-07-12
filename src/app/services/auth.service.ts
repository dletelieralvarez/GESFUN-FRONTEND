import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { apiUrl, bffApiScope, bffApiUrl, loginRequest, redirectUri, tenantId } from '../auth-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly BFF_URL = bffApiUrl;
  readonly API_URL = apiUrl;
  private readonly sessionExpiredKey = 'gesfun.sessionExpired';
  private initialized = false;
  private redirectHandled = false;

  constructor(
    private http: HttpClient,
    private msalService: MsalService,
    private router: Router
  ) {}

  private async ensureInitialized() {
    if (!this.initialized) {
      await lastValueFrom(this.msalService.initialize());
      this.initialized = true;
    }

    if (!this.redirectHandled) {
      const result = await lastValueFrom(this.msalService.handleRedirectObservable());
      if (result?.account) {
        sessionStorage.removeItem(this.sessionExpiredKey);
        this.msalService.instance.setActiveAccount(result.account);
      } else {
        this.setFirstAccountAsActive();
      }
      this.redirectHandled = true;
    }
  }

  async login(loginHint?: string): Promise<void> {
    await this.ensureInitialized();
    const request = {
      ...loginRequest,
      loginHint: loginHint || undefined,
      redirectUri
    };

    await lastValueFrom(this.msalService.loginRedirect(request));
  }

  async logout() {
    await this.ensureInitialized();
    await this.msalService.logoutPopup({
      account: this.getActiveAccount() ?? undefined,
      mainWindowRedirectUri: redirectUri
    });
  }

  getActiveAccount(): AccountInfo | null {
    const e2eAccount = this.getE2eAccount();
    if (e2eAccount) {
      return e2eAccount;
    }

    if (!this.initialized || this.hasSessionExpired()) {
      return null;
    }

    const activeAccount = this.msalService.instance.getActiveAccount();
    if (activeAccount) {
      return activeAccount;
    }

    return this.setFirstAccountAsActive();
  }

  isAuthenticated() {
    return !!this.getActiveAccount();
  }

  async getAccessToken(): Promise<string> {
    const e2eToken = this.getE2eAccessToken();
    if (e2eToken) {
      return e2eToken;
    }

    await this.ensureInitialized();
    const account = this.getActiveAccount();
    if (!account) {
      throw new Error('No hay usuario autenticado');
    }

    const request = { scopes: [bffApiScope], account, redirectUri };

    try {
      const result = await lastValueFrom(this.msalService.acquireTokenSilent(request));
      return result.accessToken;
    } catch (error) {
      if (this.requiresInteractiveToken(error)) {
        await this.handleSessionExpired();
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente para continuar.');
      }
      throw error;
    }
  }

  hasSessionExpired() {
    return sessionStorage.getItem(this.sessionExpiredKey) === 'true';
  }

  async handleSessionExpired() {
    sessionStorage.setItem(this.sessionExpiredKey, 'true');
    if (this.initialized) {
      this.msalService.instance.setActiveAccount(null);
    }

    if (!this.router.url.startsWith('/login')) {
      await this.router.navigate(['/login'], {
        replaceUrl: true,
        queryParams: { sessionExpired: 'true' }
      });
    }
  }

  getProfile() {
    return this.http.get(`${this.API_URL}/me`);
  }

  async handleRedirectResponse() {
    await this.ensureInitialized();
    return this.getActiveAccount();
  }

  private setFirstAccountAsActive(): AccountInfo | null {
    const account = this.msalService.instance.getAllAccounts()[0] ?? null;
    if (account) {
      this.msalService.instance.setActiveAccount(account);
    }
    return account;
  }

  private requiresInteractiveToken(error: unknown) {
    const authError = error as { errorCode?: string; message?: string };
    const errorCode = authError?.errorCode || '';
    const message = authError?.message || '';

    return error instanceof InteractionRequiredAuthError
      || errorCode === 'monitor_window_timeout'
      || errorCode === 'token_renewal_error'
      || errorCode === 'consent_required'
      || errorCode === 'interaction_required'
      || message.includes('monitor_window_timeout');
  }

  private getE2eAccessToken() {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem('gesfun.e2eAccessToken');
  }

  private getE2eAccount(): AccountInfo | null {
    if (!this.getE2eAccessToken()) {
      return null;
    }

    return {
      homeAccountId: 'e2e-account',
      environment: 'localhost',
      tenantId,
      username: 'playwright@gesfun.local',
      localAccountId: 'e2e-account',
      name: 'Playwright',
    } as AccountInfo;
  }
}
