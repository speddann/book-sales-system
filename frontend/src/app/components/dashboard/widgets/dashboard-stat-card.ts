import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-stat-card',
  standalone: true,
  template: `
    <button class="stat-card" type="button" (click)="cardClick.emit()">
      <span class="stat-topline">
        <span class="stat-title">{{ title }}</span>
        <span class="stat-icon" aria-hidden="true">{{ icon }}</span>
      </span>
      <span class="stat-value">{{ value }}</span>
      <span class="stat-comparison">{{ comparison }}</span>
    </button>
  `,
  styleUrl: './dashboard-stat-card.css'
})
export class DashboardStatCardComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) value = '';
  @Input() comparison = 'No comparison yet';
  @Input() icon = '↗';
  @Output() cardClick = new EventEmitter<void>();
}
