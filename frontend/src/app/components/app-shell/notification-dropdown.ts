import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  template: `
    <div class="notification-root">
      <button class="header-icon-button" type="button" aria-label="Notifications" (click)="toggle($event)">
        <span aria-hidden="true">!</span>
        <em>4</em>
      </button>

      @if (isOpen) {
        <div class="notification-menu">
          <div class="menu-title">
            <b>Notifications</b>
            <span>Placeholder</span>
          </div>
          @for (notification of notifications; track notification.title) {
            <button type="button" class="notification-item">
              <b>{{ notification.title }}</b>
              <span>{{ notification.detail }}</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './notification-dropdown.css'
})
export class NotificationDropdownComponent {
  isOpen = false;

  readonly notifications = [
    { title: 'Inventory low', detail: '3 books need reorder attention.' },
    { title: 'Promotion ending', detail: 'Summer Reads ends soon.' },
    { title: 'Sale completed', detail: 'A new order was processed.' },
    { title: 'Return processed', detail: 'Returns workflow placeholder.' }
  ];

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click')
  close(): void {
    this.isOpen = false;
  }
}
