import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppView } from './navigation.models';
import { BreadcrumbComponent } from './breadcrumb';
import { SearchBarComponent } from './search-bar';
import { NotificationDropdownComponent } from './notification-dropdown';
import { UserMenuComponent } from './user-menu';

@Component({
  selector: 'app-top-header',
  standalone: true,
  imports: [BreadcrumbComponent, SearchBarComponent, NotificationDropdownComponent, UserMenuComponent],
  template: `
    <header class="top-header">
      <div class="header-left">
        <button class="collapse-button desktop-only" type="button" aria-label="Collapse sidebar" (click)="toggleSidebar.emit()">=</button>
        <button class="collapse-button mobile-only" type="button" aria-label="Open navigation" (click)="openMobile.emit()">=</button>
        <app-breadcrumb [activeView]="activeView"></app-breadcrumb>
      </div>

      <div class="header-center">
        <app-search-bar></app-search-bar>
      </div>

      <div class="header-right">
        <app-notification-dropdown></app-notification-dropdown>
        <button class="theme-button" type="button" aria-label="Theme switch">T</button>
        <span class="store-status">Store Open</span>
        <app-user-menu></app-user-menu>
      </div>
    </header>
  `,
  styleUrl: './top-header.css'
})
export class TopHeaderComponent {
  @Input({ required: true }) activeView: AppView = 'dashboard';
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openMobile = new EventEmitter<void>();
}
