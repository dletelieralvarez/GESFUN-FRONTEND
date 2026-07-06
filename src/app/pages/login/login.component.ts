import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AccountInfo } from '@azure/msal-browser';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { bffApiUrl } from '../../auth-config';

interface ApiResponse<T> {
  payload?: T;
}

interface ApiUser {
  email?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  initializing = true;
  loading = false;
  error: string | null = null;
  info: string | null = null;
  showMissingUserModal = false;
  registeringUser = false;
  pendingAccount: AccountInfo | null = null;

  constructor(
    public auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    const sessionExpired = this.auth.hasSessionExpired();
    if (sessionExpired) {
      this.info = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
    }

    try {
      const account = await this.auth.handleRedirectResponse();
      if (account && !this.auth.hasSessionExpired()) {
        this.info = null;
        await this.continueWithSystemUser(account);
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo inicializar Microsoft Entra ID.');
    } finally {
      this.initializing = false;
    }
  }

  get account(): AccountInfo | null {
    return this.auth.getActiveAccount();
  }

  async login() {
    if (this.initializing || this.loading || this.showMissingUserModal) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.info = null;

    try {
      await this.auth.login();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo iniciar sesion con Microsoft.');
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    if (this.initializing || this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.info = null;

    try {
      await this.auth.logout();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo cerrar sesion.');
    } finally {
      this.loading = false;
    }
  }

  async confirmCreateUser() {
    if (!this.pendingAccount) {
      return;
    }

    this.registeringUser = true;
    this.error = null;

    try {
      await this.createSystemUser(this.pendingAccount);
      this.showMissingUserModal = false;
      await this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo ingresar el usuario en el sistema.');
    } finally {
      this.registeringUser = false;
    }
  }

  async rejectCreateUser() {
    this.showMissingUserModal = false;
    this.pendingAccount = null;
    await this.logout();
  }

  private async continueWithSystemUser(account: AccountInfo) {
    this.loading = true;
    this.error = null;

    try {
      const exists = await this.systemUserExists(account);
      if (exists) {
        await this.router.navigate(['/dashboard']);
        return;
      }

      this.pendingAccount = account;
      this.showMissingUserModal = true;
    } finally {
      this.loading = false;
    }
  }

  private async systemUserExists(account: AccountInfo) {
    const token = await this.auth.getAccessToken();
    const response = await lastValueFrom(this.http.get<ApiResponse<ApiUser[]> | ApiUser[]>(
      `${bffApiUrl}/api/usuarios`,
      { headers: { Authorization: `Bearer ${token}` } }
    ));
    const users = Array.isArray(response) ? response : response.payload || [];
    const email = this.getAccountEmail(account).toLocaleLowerCase('es-CL');

    return users.some(user => String(user.email || '').trim().toLocaleLowerCase('es-CL') === email);
  }

  private async createSystemUser(account: AccountInfo) {
    const token = await this.auth.getAccessToken();
    const payload = this.toNewUserPayload(account);

    await lastValueFrom(this.http.post(`${bffApiUrl}/api/usuarios`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    }));
  }

  private toNewUserPayload(account: AccountInfo) {
    const nameParts = String(account.name || '').trim().split(/\s+/).filter(Boolean);
    const nombre = nameParts.length > 2 ? nameParts.slice(0, -2).join(' ') : nameParts[0] || this.getAccountEmail(account);
    const paterno = nameParts.length > 1 ? nameParts[nameParts.length - 2] : '';
    const materno = nameParts.length > 2 ? nameParts[nameParts.length - 1] : '';

    return {
      uuid: crypto.randomUUID?.() ?? '00000000-0000-0000-0000-000000000000',
      email: this.getAccountEmail(account),
      nombre,
      paterno,
      materno,
      activo: 1,
      roles: 'USER',
      tipoUsuario: 'USUARIO'
    };
  }

  private getAccountEmail(account: AccountInfo) {
    return String(account.username || account.idTokenClaims?.preferred_username || account.idTokenClaims?.upn || '').trim();
  }

  private getErrorMessage(error: any, fallback: string) {
    return error?.errorMessage || error?.message || fallback;
  }
}
