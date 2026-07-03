import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AppView, NavigationGroup } from './navigation.models';

@Component({
  selector: 'app-navigation-group',
  standalone: true,
  template: `
    <div class="nav-group" [class.collapsed]="collapsed">
      <button
        type="button"
        class="group-button"
        [class.active]="isGroupActive"
        (click)="toggleGroup()">
        <span class="nav-icon">{{ group.icon }}</span>
        <span class="group-label">{{ group.label }}</span>
        <span class="chevron" [class.open]="isOpen">&gt;</span>
      </button>

      <div class="group-items" [class.open]="isOpen && !collapsed">
        @for (item of group.items; track item.view) {
          <button
            type="button"
            class="nav-item"
            [class.active]="activeView === item.view"
            [class.placeholder]="item.placeholder"
            (click)="select(item.view)">
            <span class="nav-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: './navigation-group.css'
})
export class NavigationGroupComponent implements OnChanges {
  @Input({ required: true }) group!: NavigationGroup;
  @Input({ required: true }) activeView: AppView = 'dashboard';
  @Input() collapsed = false;
  @Output() navigate = new EventEmitter<AppView>();

  isOpen = false;

  get isGroupActive(): boolean {
    return this.group.items.some(item => item.view === this.activeView);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeView'] && this.isGroupActive) {
      this.isOpen = true;
    }
  }

  toggleGroup(): void {
    if (this.collapsed) {
      const firstItem = this.group.items[0];
      if (firstItem) this.select(firstItem.view);
      return;
    }

    this.isOpen = !this.isOpen;
  }

  select(view: AppView): void {
    this.navigate.emit(view);
  }
}
