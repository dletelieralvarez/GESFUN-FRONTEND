import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LayoutService } from './services/layout.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gesfun-frontend';
  showShell = true;
  sidebarOpen$ = this.layout.sidebarOpen$;

  constructor(private router: Router, public layout: LayoutService) {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((event: any) => {
      const path = event.urlAfterRedirects || event.url;
      this.showShell = !(path.startsWith('/login') || path.startsWith('/auth/callback'));
    });
  }
}
