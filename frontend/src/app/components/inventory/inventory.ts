import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService, Book, InventoryHistoryItem } from '../../services/book';

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
  lowStockBooks = signal<Book[]>([]);
  lowStockThreshold: number = 5;
  inventoryHistory = signal<InventoryHistoryItem[]>([]);
  adjustments: { [bookId: number]: StockAdjustment } = {};
  message: string = '';
  error: string = '';

  historyBookId: number | null = null;
  historyType: string = 'all';
  historyStartDate: string = '';
  historyEndDate: string = '';

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
    this.loadInventoryHistory();
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe(data => {
      this.books.set(data);
      this.loadLowStockBooks();

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

  loadLowStockBooks(): void {
    const lowStock = this.books().filter(book => book.stock <= this.lowStockThreshold);
    this.lowStockBooks.set(lowStock);
  }

  loadInventoryHistory(): void {
    this.bookService
      .getInventoryHistory(
        this.historyBookId,
        this.historyType,
        this.historyStartDate,
        this.historyEndDate
      )
      .subscribe(data => {
        this.inventoryHistory.set(data);
      });
  }

  applyHistoryFilter(): void {
    this.loadInventoryHistory();
  }

  clearHistoryFilter(): void {
    this.historyBookId = null;
    this.historyType = 'all';
    this.historyStartDate = '';
    this.historyEndDate = '';
    this.loadInventoryHistory();
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
        this.loadInventoryHistory();
      },
      error: (err) => {
        this.error = err.error?.message || 'Stock update failed.';
        this.message = '';
      }
    });
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  getReorderQty(stock: number): number {
    return Math.max(20 - stock, 10);
  }
}