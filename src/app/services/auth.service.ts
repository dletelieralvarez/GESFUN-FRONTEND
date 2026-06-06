import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult, InteractionRequiredAuthError } from '@azure/msal-browser';
import { lastValueFrom } from 'rxjs';
import { bffApiScope, bffApiUrl, loginRequest, redirectUri } from '../auth-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly BFF_URL = bffApiUrl;
  private initialized = false;
  private redirectHandled = false;

  constructor(private http: HttpClient, private msalService: MsalService) {}

  private async ensureInitialized() {
    if (!this.initialized) {
      await lastValueFrom(this.msalService.initialize());
      this.initialized = true;
    }

    if (!this.redirectHandled) {
      const result = await lastValueFrom(this.msalService.handleRedirectObservable());
      if (result?.account) {
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
    if (!this.initialized) {
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
    await this.ensureInitialized();
    const account = this.getActiveAccount();
    if (!account) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      const result = await lastValueFrom(this.msalService.acquireTokenSilent({ scopes: [bffApiScope], account, redirectUri }));
      return result.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const result = await lastValueFrom(this.msalService.acquireTokenPopup({ scopes: [bffApiScope], account, redirectUri }));
        return result.accessToken;
      }
      throw error;
    }
  }

  getProfile() {
    return this.http.get(`${this.BFF_URL}/api/me`);
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
}
