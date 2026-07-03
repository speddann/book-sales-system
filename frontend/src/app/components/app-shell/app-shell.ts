import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppView } from './navigation.models';
import { SidebarComponent } from './sidebar';
import { TopHeaderComponent } from './top-header';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SidebarComponent, TopHeaderComponent],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed">
      <app-sidebar
        [activeView]="activeView"
        [collapsed]="sidebarCollapsed"
        [mobileOpen]="mobileOpen"
        (navigate)="handleNavigate($event)"
        (closeMobile)="mobileOpen = false">
      </app-sidebar>

      <section class="shell-body">
        <app-top-header
          [activeView]="activeView"
          (toggleSidebar)="toggleSidebar()"
          (openMobile)="mobileOpen = true">
        </app-top-header>

        <main class="shell-content">
          <ng-content></ng-content>
        </main>
      </section>
    </div>
  `,
  styleUrl: './app-shell.css'
})
export class AppShellComponent implements OnInit {
  private readonly collapsedKey = 'bookSalesSidebarCollapsed';
  private readonly lastSelectedKey = 'bookSalesLastSelectedMenu';

  @Input({ required: true }) activeView: AppView = 'dashboard';
  @Output() navigate = new EventEmitter<AppView>();

  sidebarCollapsed = false;
  mobileOpen = false;

  ngOnInit(): void {
    this.sidebarCollapsed = localStorage.getItem(this.collapsedKey) === 'true';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem(this.collapsedKey, String(this.sidebarCollapsed));
  }

  handleNavigate(view: AppView): void {
    localStorage.setItem(this.lastSelectedKey, view);
    this.navigate.emit(view);
  }
}
