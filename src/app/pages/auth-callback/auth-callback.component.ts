import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: '<div class="p-4">Procesando autenticación...</div>'
})
export class AuthCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    // Try query param 'token' then fragment 'access_token'
    this.route.queryParams.subscribe(q => {
      const token = q['token'];
      if (token) {
        this.auth.handleCallbackToken(token);
        this.router.navigateByUrl('/');
        return;
      }
      // try fragment
      this.route.fragment.subscribe(f => {
        if (!f) { this.router.navigateByUrl('/login'); return; }
        const m = /access_token=([^&]+)/.exec(f);
        if (m) {
          this.auth.handleCallbackToken(decodeURIComponent(m[1]));
          this.router.navigateByUrl('/');
        } else {
          this.router.navigateByUrl('/login');
        }
      });
    });
  }
}
