import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type HomeFeatureMode = 'Automatic' | 'Manual';
export type HomeFeatureStatus = 'Draft' | 'Scheduled' | 'Active' | 'Expired' | 'Hidden' | 'Archived';

export interface HomeSectionConfig {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  mode: HomeFeatureMode;
  status: HomeFeatureStatus;
}

@Component({
  selector: 'app-home-section-card',
  standalone: true,
  imports: [FormsModule],
  template: `
    <article class="section-card">
      <div>
        <h3>{{ section.name }}</h3>
        <p>{{ section.description }}</p>
      </div>

      <label class="toggle-row">
        <input type="checkbox" [(ngModel)]="section.visible" (ngModelChange)="changed.emit()" />
        <span>{{ section.visible ? 'Visible' : 'Hidden' }}</span>
      </label>

      <label>
        Mode
        <select [(ngModel)]="section.mode" (ngModelChange)="changed.emit()">
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </select>
      </label>

      <label>
        Status
        <select [(ngModel)]="section.status" (ngModelChange)="changed.emit()">
          @for (status of statuses; track status) {
            <option [value]="status">{{ status }}</option>
          }
        </select>
      </label>

      <button type="button" class="ghost-button" (click)="edit.emit(section.id)">Edit</button>
    </article>
  `,
  styleUrl: './home-section-card.css'
})
export class HomeSectionCardComponent {
  @Input({ required: true }) section!: HomeSectionConfig;
  @Output() changed = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();

  readonly statuses: HomeFeatureStatus[] = ['Draft', 'Scheduled', 'Active', 'Expired', 'Hidden', 'Archived'];
}
