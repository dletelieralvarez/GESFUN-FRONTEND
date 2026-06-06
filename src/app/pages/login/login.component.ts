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
  userName = '';
  password = '';
  profile: any = null;
  loading = false;
  error: string | null = null;
  info: string | null = null;

  constructor(public auth: AuthService, private router: Router) {}

  async ngOnInit() {
    try {
      const account = await this.auth.handleRedirectResponse();
      if (account) {
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
    this.profile = null;

    try {
      await this.auth.login(this.userName.trim());
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo iniciar sesion con Microsoft.');
    } finally {
      this.loading = false;
    }
  }

  async loginWithCredentials() {
    this.info = 'El acceso local redirige al flujo corporativo de Microsoft Entra ID.';
    await this.login();
  }

  async logout() {
    this.loading = true;
    this.error = null;
    this.info = null;
    this.profile = null;

    try {
      await this.auth.logout();
    } catch (err: any) {
      this.error = this.getErrorMessage(err, 'No se pudo cerrar sesion.');
    } finally {
      this.loading = false;
    }
  }

  recoverPassword() {
    window.open('https://passwordreset.microsoftonline.com/', '_blank');
  }

  private getErrorMessage(error: any, fallback: string) {
    return error?.errorMessage || error?.message || fallback;
  }
}
