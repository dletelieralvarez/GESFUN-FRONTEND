import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {
  title = 'Panel general';
  crumb = 'Inicio';
  private subscriptions = new Subscription();

  constructor(private router: Router, private route: ActivatedRoute, public layout: LayoutService) {}

  ngOnInit() {
    this.updateMetadata();
    this.subscriptions.add(
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.updateMetadata())
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private updateMetadata() {
    let activeRoute = this.route.root;
    while (activeRoute.firstChild) {
      activeRoute = activeRoute.firstChild;
    }
    const data = activeRoute.snapshot.data;
    this.title = data['title'] || 'Panel general';
    this.crumb = data['crumb'] || 'Inicio';
  }

  goNew() {
    this.router.navigate(['/cotizacion']);
  }
}
