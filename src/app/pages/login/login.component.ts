import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AccountInfo } from '@azure/msal-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loading = false;
  error: string | null = null;
  info: string | null = null;

  constructor(public auth: AuthService, private router: Router) {}

  async ngOnInit() {
    const sessionExpired = this.auth.hasSessionExpired();
    if (sessionExpired) {
      this.info = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
    }

    try {
      const account = await this.auth.handleRedirectResponse();
      if (account && !this.auth.hasSessionExpired()) {
        this.info = null;
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo inicializar Microsoft Entra ID.');
    }
  }

  get account(): AccountInfo | null {
    return this.auth.getActiveAccount();
  }

  async login() {
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

  private getErrorMessage(error: any, fallback: string) {
    return error?.errorMessage || error?.message || fallback;
  }
}
