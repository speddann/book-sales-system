import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-dashboard-action-tile',
  standalone: true,
  template: `
    <button class="action-tile" type="button" (click)="actionClick.emit()">
      <span class="action-icon" aria-hidden="true">{{ icon }}</span>
      <span>
        <span class="action-title">{{ title }}</span>
        <span class="action-description">{{ description }}</span>
      </span>
    </button>
  `,
  styleUrl: './dashboard-action-tile.css'
})
export class DashboardActionTileComponent {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() icon = '+';
  @Output() actionClick = new EventEmitter<void>();
}
