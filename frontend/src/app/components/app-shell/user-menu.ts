import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  template: `
    <div class="user-root">
      <button class="user-button" type="button" (click)="toggle($event)" aria-label="User menu">
        <span>S</span>
        <b>Santosh</b>
      </button>

      @if (isOpen) {
        <div class="user-menu">
          <div class="user-card">
            <span>S</span>
            <div>
              <b>Santosh</b>
              <small>Owner Portal</small>
            </div>
          </div>
          <button type="button">Profile</button>
          <button type="button">Settings</button>
          <button type="button">Logout</button>
        </div>
      }
    </div>
  `,
  styleUrl: './user-menu.css'
})
export class UserMenuComponent {
  isOpen = false;

  toggle(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click')
  close(): void {
    this.isOpen = false;
  }
}
