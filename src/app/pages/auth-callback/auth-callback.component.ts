import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: '<div class="p-4">Procesando autenticacion...</div>'
})
export class AuthCallbackComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    const account = await this.auth.handleRedirectResponse();
    this.router.navigateByUrl(account ? '/dashboard' : '/login');
  }
}
