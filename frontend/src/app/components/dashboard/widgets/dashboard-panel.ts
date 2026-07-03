import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-panel',
  standalone: true,
  template: `
    <section class="dashboard-panel">
      <div class="panel-header">
        <div>
          <h3>{{ title }}</h3>
          @if (subtitle) {
            <p>{{ subtitle }}</p>
          }
        </div>
        <ng-content select="[panel-action]"></ng-content>
      </div>
      <ng-content></ng-content>
    </section>
  `,
  styleUrl: './dashboard-panel.css'
})
export class DashboardPanelComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
