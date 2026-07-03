import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface HomePromotion {
  id: string;
  name: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerImageUrl: string;
  buttonText: string;
  buttonLink: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Scheduled' | 'Active' | 'Expired' | 'Hidden' | 'Archived';
  bookIds: number[];
}

@Component({
  selector: 'app-promotion-card',
  standalone: true,
  template: `
    <article class="promotion-card">
      <div>
        <span class="status-pill">{{ promotion.status }}</span>
        <h3>{{ promotion.name }}</h3>
        <p>{{ promotion.bannerTitle }}</p>
        <small>{{ promotion.startDate || 'No start' }} to {{ promotion.endDate || 'No end' }}</small>
      </div>
      <div class="promotion-actions">
        <button type="button" (click)="edit.emit(promotion.id)">Edit</button>
        <button type="button" (click)="duplicate.emit(promotion.id)">Duplicate</button>
        <button type="button" (click)="archive.emit(promotion.id)">Archive</button>
      </div>
    </article>
  `,
  styleUrl: './promotion-card.css'
})
export class PromotionCardComponent {
  @Input({ required: true }) promotion!: HomePromotion;
  @Output() edit = new EventEmitter<string>();
  @Output() duplicate = new EventEmitter<string>();
  @Output() archive = new EventEmitter<string>();
}
