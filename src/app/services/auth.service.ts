import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo, AuthenticationResult, InteractionRequiredAuthError } from '@azure/msal-browser';
import { lastValueFrom } from 'rxjs';
import { bffApiScope, bffApiUrl } from '../auth-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly BFF_URL = bffApiUrl;
  private initialized = false;

  constructor(private http: HttpClient, private router: Router, private msalService: MsalService) {}

  private async ensureInitialized() {
    if (!this.initialized) {
      await lastValueFrom(this.msalService.initialize());
      this.initialized = true;
    }
  }

  async login() {
    await this.ensureInitialized();
    try {
      const authResult = await lastValueFrom(this.msalService.loginPopup({ scopes: [bffApiScope] }));
      if (authResult.account) {
        this.msalService.instance.setActiveAccount(authResult.account);
      }
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await lastValueFrom(this.msalService.loginRedirect({ scopes: [bffApiScope] }));
      } else {
        throw error;
      }
    }
  }

  async logout() {
    await this.ensureInitialized();
    await this.msalService.logoutPopup({ mainWindowRedirectUri: window.location.origin });
  }

  getAccount(): AccountInfo | null {
    return this.msalService.instance.getActiveAccount() ?? this.msalService.instance.getAllAccounts()[0] ?? null;
  }

  isAuthenticated() {
    return !!this.getAccount();
  }

  async getAccessToken(): Promise<string> {
    await this.ensureInitialized();
    const account = this.getAccount();
    if (!account) {
      throw new Error('No hay usuario autenticado');
    }
    try {
      const result = await lastValueFrom(this.msalService.acquireTokenSilent({ scopes: [bffApiScope], account }));
      return result.accessToken;
    } catch (error) {
      const result = await lastValueFrom(this.msalService.acquireTokenPopup({ scopes: [bffApiScope] }));
      return result.accessToken;
    }
  }

  getProfile() {
    return this.http.get(`${this.BFF_URL}/api/me`);
  }
}
