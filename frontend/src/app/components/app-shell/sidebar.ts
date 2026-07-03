import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppView, NAVIGATION_GROUPS } from './navigation.models';
import { NavigationGroupComponent } from './navigation-group';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NavigationGroupComponent],
  template: `
    @if (mobileOpen) {
      <div class="sidebar-backdrop" (click)="closeMobile.emit()"></div>
    }

    <aside class="sidebar" [class.collapsed]="collapsed" [class.mobile-open]="mobileOpen">
      <div class="brand-block">
        <button class="brand-mark" type="button" (click)="navigate.emit('dashboard')">B</button>
        <div class="brand-text">
          <b>Book Sales</b>
          <span>Owner Portal</span>
        </div>
      </div>

      <nav class="sidebar-nav" aria-label="Main navigation">
        <button
          type="button"
          class="single-nav"
          [class.active]="activeView === 'dashboard'"
          (click)="select('dashboard')">
          <span class="nav-icon">D</span>
          <span>Dashboard</span>
        </button>

        @for (group of groups; track group.id) {
          <app-navigation-group
            [group]="group"
            [activeView]="activeView"
            [collapsed]="collapsed"
            (navigate)="select($event)">
          </app-navigation-group>
        }

        <button
          type="button"
          class="single-nav"
          [class.active]="activeView === 'customers'"
          (click)="select('customers')">
          <span class="nav-icon">C</span>
          <span>Customers</span>
        </button>

        <button
          type="button"
          class="single-nav placeholder"
          [class.active]="activeView === 'reports'"
          (click)="select('reports')">
          <span class="nav-icon">R</span>
          <span>Reports</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="single-nav placeholder" (click)="select('help')">
          <span class="nav-icon">?</span>
          <span>Help</span>
        </button>
        <p>Version 1.0.0</p>
      </div>
    </aside>
  `,
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  @Input({ required: true }) activeView: AppView = 'dashboard';
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() navigate = new EventEmitter<AppView>();
  @Output() closeMobile = new EventEmitter<void>();

  readonly groups = NAVIGATION_GROUPS;

  select(view: AppView): void {
    this.navigate.emit(view);
    this.closeMobile.emit();
  }
}
