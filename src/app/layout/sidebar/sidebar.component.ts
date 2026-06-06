import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NAV_BS } from '../../data/mock-data';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  nav = NAV_BS;
  currentView = 'dashboard';
  loggingOut = false;
  private subscriptions = new Subscription();

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    this.setCurrentView(this.router.url);
    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
        const navEvent = event as NavigationEnd;
        this.setCurrentView(navEvent.urlAfterRedirects);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private setCurrentView(url: string) {
    this.currentView = url.replace(/^\//, '') || 'dashboard';
  }

  get userName() {
    const account = this.auth.getActiveAccount();
    return account?.name || account?.username || 'Usuario';
  }

  get userEmail() {
    return this.auth.getActiveAccount()?.username || 'Sesion activa';
  }

  async logout() {
    if (this.loggingOut) {
      return;
    }

    this.loggingOut = true;
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('No se pudo cerrar sesion', error);
      this.loggingOut = false;
    }
  }
}
