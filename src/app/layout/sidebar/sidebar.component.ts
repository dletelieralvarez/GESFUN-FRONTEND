import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { NAV_BS } from '../../data/mock-data';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  nav = NAV_BS;
  currentView = 'dashboard';
  private subscriptions = new Subscription();

  constructor(private router: Router) {}

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
}
