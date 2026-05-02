import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../services/book';

interface StockAdjustment {
  type: 'increase' | 'decrease';
  quantity: number;
  reason: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit {
  books = signal<Book[]>([]);
  adjustments: { [bookId: number]: StockAdjustment } = {};
  message: string = '';
  error: string = '';

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe(data => {
      this.books.set(data);

      data.forEach(book => {
        if (book.id && !this.adjustments[book.id]) {
          this.adjustments[book.id] = {
            type: 'increase',
            quantity: 0,
            reason: ''
          };
        }
      });
    });
  }

  updateStock(book: Book): void {
    if (!book.id) return;

    const adjustment = this.adjustments[book.id];

    if (!adjustment || adjustment.quantity <= 0) {
      this.error = 'Please enter a valid quantity.';
      return;
    }

    if (!adjustment.reason.trim()) {
      this.error = 'Please enter a reason for stock adjustment.';
      return;
    }

    this.bookService.adjustStock(book.id, {
      type: adjustment.type,
      quantity: adjustment.quantity,
      reason: adjustment.reason
    }).subscribe({
      next: () => {
        this.message = 'Stock updated successfully.';
        this.error = '';

        adjustment.quantity = 0;
        adjustment.reason = '';

        this.loadBooks();
      },
      error: (err) => {
        this.error = err.error?.message || 'Stock update failed.';
        this.message = '';
      }
    });
  }
}