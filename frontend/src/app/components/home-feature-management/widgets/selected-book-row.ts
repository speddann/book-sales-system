import { Component, EventEmitter, Input, Output } from '@angular/core';
import { BookAdminDto } from '../../../services/book';

@Component({
  selector: 'app-selected-book-row',
  standalone: true,
  template: `
    <div class="selected-book">
      <span class="book-cover">{{ getInitial(book.title) }}</span>
      <span class="book-info">
        <b>{{ book.title }}</b>
        <small>{{ book.author }} · {{ book.category || 'Uncategorized' }}</small>
      </span>
      <span class="book-price">{{ getPrice(book) }}</span>
      <div class="book-actions">
        <button type="button" (click)="moveUp.emit()">Up</button>
        <button type="button" (click)="moveDown.emit()">Down</button>
        <button type="button" (click)="remove.emit()">Remove</button>
      </div>
    </div>
  `,
  styleUrl: './selected-book-row.css'
})
export class SelectedBookRowComponent {
  @Input({ required: true }) book!: BookAdminDto;
  @Output() moveUp = new EventEmitter<void>();
  @Output() moveDown = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  getInitial(title: string): string {
    return (title || 'B').slice(0, 1).toUpperCase();
  }

  getPrice(book: BookAdminDto): string {
    const price = book.sellingPrice ?? book.price ?? 0;
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(price);
  }
}
