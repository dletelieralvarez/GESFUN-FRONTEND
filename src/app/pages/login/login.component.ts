import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  userName = '';
  password = '';
  profile: any = null;
  loading = false;
  error: string | null = null;
  info: string | null = null;

  constructor(public auth: AuthService, private router: Router) {}

  async login() {
    this.error = null;
    this.info = null;
    this.loading = true;
    try {
      await this.auth.login();
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = err?.message || 'No se pudo iniciar sesión con Microsoft';
    } finally {
      this.loading = false;
    }
  }

  async loginWithCredentials() {
    this.info = 'Se usará Microsoft Entra para iniciar sesión con MFA.';
    await this.login();
  }

  recoverPassword() {
    window.open('https://passwordreset.microsoftonline.com/', '_blank');
  }

  testAuth() {
    this.loading = true;
    this.error = null;
    this.profile = null;
    this.auth.getProfile().subscribe({
      next: (res) => { this.profile = res; this.loading = false; },
      error: (err) => { this.error = err?.error?.message || (err.statusText || 'Error'); this.loading = false; }
    });
  }

  logout() {
    this.auth.logout();
  }
}
