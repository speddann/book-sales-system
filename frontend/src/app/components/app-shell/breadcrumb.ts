import { Component, Input } from '@angular/core';
import { AppView, VIEW_LABELS, VIEW_PARENTS } from './navigation.models';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      @for (crumb of crumbs; track crumb; let last = $last) {
        <span [class.current]="last">{{ crumb }}</span>
        @if (!last) {
          <span class="separator">/</span>
        }
      }
    </nav>
  `,
  styleUrl: './breadcrumb.css'
})
export class BreadcrumbComponent {
  @Input({ required: true }) activeView: AppView = 'dashboard';

  get crumbs(): string[] {
    if (this.activeView === 'dashboard') return ['Dashboard'];

    const parent = VIEW_PARENTS[this.activeView];
    const current = VIEW_LABELS[this.activeView];

    return parent ? ['Dashboard', parent, current] : ['Dashboard', current];
  }
}
