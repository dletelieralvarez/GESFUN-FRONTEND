import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly sidebarOpenSubject = new BehaviorSubject(false);
  readonly sidebarOpen$ = this.sidebarOpenSubject.asObservable();

  openSidebar() {
    this.sidebarOpenSubject.next(true);
  }

  closeSidebar() {
    this.sidebarOpenSubject.next(false);
  }

  toggleSidebar() {
    this.sidebarOpenSubject.next(!this.sidebarOpenSubject.value);
  }
}
