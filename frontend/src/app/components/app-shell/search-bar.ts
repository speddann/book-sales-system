import { Component } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  template: `
    <div class="search-wrap">
      <span class="search-icon" aria-hidden="true">S</span>
      <input
        type="search"
        placeholder="Search books, customers, orders..."
        (focus)="isOpen = true"
        (blur)="closeSoon()"
      />

      @if (isOpen) {
        <div class="search-popover">
          <b>Recent searches</b>
          <button type="button">Atomic Habits</button>
          <button type="button">Walk-in orders</button>
          <button type="button">Low stock books</button>
        </div>
      }
    </div>
  `,
  styleUrl: './search-bar.css'
})
export class SearchBarComponent {
  isOpen = false;

  closeSoon(): void {
    window.setTimeout(() => {
      this.isOpen = false;
    }, 120);
  }
}
