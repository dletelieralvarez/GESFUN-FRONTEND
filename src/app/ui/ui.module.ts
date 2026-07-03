import { CommonModule } from '@angular/common';
import { NgModule, Component, Input, Output, EventEmitter } from '@angular/core';
import { colorFor, initials, ESTADO_BS } from '../data/ui-data';

@Component({
  selector: 'app-avatar',
  template: `<div class="avatar" [ngStyle]="style">{{ initialsText }}</div>`,
})
export class AvatarComponent {
  @Input() name = '';
  @Input() size = 34;

  get initialsText() {
    return initials(this.name);
  }

  get style() {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`,
      background: colorFor(this.name),
      fontSize: `${this.size * 0.37}px`,
    };
  }
}

@Component({
  selector: 'app-badge',
  template: `<span class="badge rounded-pill" [ngClass]="cls"><span *ngIf="dot" class="dotb"></span><ng-content></ng-content></span>`,
})
export class BadgeComponent {
  @Input() cls = '';
  @Input() dot = false;
}

@Component({
  selector: 'app-estado-badge',
  template: `<app-badge [cls]="cls" [dot]="true">{{ estado }}</app-badge>`,
})
export class EstadoBadgeComponent {
  @Input() estado = '';

  get cls() {
    return ESTADO_BS[this.estado] || 'b-neutral';
  }
}

@Component({
  selector: 'app-page-head',
  template: `
    <div class="d-flex align-items-end gap-3 flex-wrap mb-4">
      <div class="flex-grow-1" style="min-width: 200px;">
        <h1 class="h3 fw-800 ls-tight mb-0">{{ title }}</h1>
        <p *ngIf="sub" class="text-secondary mb-0 mt-1" style="font-size: .9rem;">{{ sub }}</p>
      </div>
      <ng-content></ng-content>
    </div>
  `,
})
export class PageHeadComponent {
  @Input() title = '';
  @Input() sub = '';
}

@Component({
  selector: 'app-progress',
  template: `
    <div class="progress" [ngStyle]="{ height: '7px' }">
      <div class="progress-bar" [ngStyle]="{ width: value + '%', background: color || 'var(--brand)' }"></div>
    </div>
  `,
})
export class ProgressComponent {
  @Input() value = 0;
  @Input() color?: string;
}

@Component({
  selector: 'app-pills',
  template: `
    <ul class="nav nav-pills">
      <li class="nav-item" *ngFor="let tab of tabs">
        <button type="button" class="nav-link" [class.active]="active === tab" (click)="select(tab)">{{ tab }}</button>
      </li>
    </ul>
  `,
})
export class PillsComponent {
  @Input() tabs: string[] = [];
  @Input() active = '';
  @Output() selected = new EventEmitter<string>();

  select(tab: string) {
    this.selected.emit(tab);
  }
}

@Component({
  selector: 'app-filter-chip',
  template: `
    <button class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2">
      <span *ngIf="label" class="text-secondary">{{ label }}</span>
      <span>{{ value }}</span>
      <i class="bi bi-chevron-down" style="font-size:.7rem"></i>
    </button>
  `,
})
export class FilterChipComponent {
  @Input() label = '';
  @Input() value = '';
}

@Component({
  selector: 'app-stat',
  template: `
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex align-items-start justify-content-between mb-3">
          <div class="icon-tile" [ngStyle]="{ background: tintBg, color: tintFg }">
            <i class="bi" [ngClass]="'bi-' + icon"></i>
          </div>
          <span *ngIf="delta"
                class="small fw-semibold d-inline-flex align-items-center gap-1"
                [ngClass]="{ 'text-danger': deltaDir === 'down' }"
                [ngStyle]="deltaDir === 'down' ? {} : { color: 'var(--brand)' }">
            <i class="bi" [ngClass]="'bi-' + (deltaDir === 'down' ? 'arrow-down-short' : 'arrow-up-short')"></i>
            {{ delta }}
          </span>
        </div>
        <div class="kpi-val tnum">{{ value }}</div>
        <div class="text-secondary small fw-semibold mt-1">{{ label }}</div>
      </div>
    </div>
  `,
})
export class StatComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() value: string | number = '';
  @Input() delta?: string;
  @Input() deltaDir?: 'down' | 'up';
  @Input() tintBg?: string;
  @Input() tintFg?: string;
}

@NgModule({
  declarations: [
    AvatarComponent,
    BadgeComponent,
    EstadoBadgeComponent,
    PageHeadComponent,
    ProgressComponent,
    PillsComponent,
    FilterChipComponent,
    StatComponent,
  ],
  imports: [CommonModule],
  exports: [
    AvatarComponent,
    BadgeComponent,
    EstadoBadgeComponent,
    PageHeadComponent,
    ProgressComponent,
    PillsComponent,
    FilterChipComponent,
    StatComponent,
  ],
})
export class UiModule {}
