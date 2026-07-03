import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import {
  BookService,
  BookAdminDto,
  InventoryHistoryItem,
  InventoryImportPreviewResponse,
  InventoryImportRow,
  StockAdjustmentRequest
} from '../../services/book';

interface StockAdjustment {
  transactionType: 'Increase' | 'Decrease';
  quantity: number;
  reasonCategory: string;
  transactionDate: string;
  notes: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit {
  books = signal<BookAdminDto[]>([]);
  lowStockBooks = signal<BookAdminDto[]>([]);
  lowStockThreshold: number = 5;
  inventorySearchText: string = '';
  selectedManualBookId: number | null = null;
  inventoryHistory = signal<InventoryHistoryItem[]>([]);
  adjustments: { [bookId: number]: StockAdjustment } = {};
  message: string = '';
  error: string = '';
  isLoadingBooks = false;
  isLoadingHistory = false;
  updatingBookId: number | null = null;
  selectedImportFile: File | null = null;
  importPreview: InventoryImportPreviewResponse | null = null;
  importMessage = '';
  importError = '';
  isPreviewingImport = false;
  isConfirmingImport = false;

  reasonCategories: string[] = [
    'New Shipment',
    'Damaged',
    'Lost',
    'Correction',
    'Return To Stock',
    'Physical Count Adjustment'
  ];

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
    this.isLoadingBooks = true;
    this.error = '';

    this.bookService.getAdminBooks().subscribe(data => {
      this.books.set(data);
      this.loadLowStockBooks();

      data.forEach(book => {
        if (book.id && !this.adjustments[book.id]) {
          this.adjustments[book.id] = this.createDefaultAdjustment();
        }
      });
      this.isLoadingBooks = false;
    }, () => {
      this.error = 'Failed to load books.';
      this.isLoadingBooks = false;
    });
  }

  loadLowStockBooks(): void {
    const lowStock = this.books().filter(book => book.stock <= this.lowStockThreshold);
    this.lowStockBooks.set(lowStock);
  }

  loadInventoryHistory(): void {
    this.isLoadingHistory = true;
    this.error = '';

    this.bookService
      .getInventoryHistory(
        this.historyBookId,
        this.historyType,
        this.historyStartDate,
        this.historyEndDate
      )
      .subscribe(data => {
        this.inventoryHistory.set(data);
        this.isLoadingHistory = false;
      }, () => {
        this.error = 'Failed to load inventory history.';
        this.isLoadingHistory = false;
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

  downloadTemplate(type: 'current' | 'blank'): void {
    this.bookService.downloadInventoryImportTemplate(type).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = type === 'current'
          ? 'current-inventory-import-template.xlsx'
          : 'blank-inventory-import-template.xlsx';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.importError = this.getImportErrorMessage(err, 'Failed to download template.');
      }
    });
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImportFile = input.files?.[0] ?? null;
    this.importPreview = null;
    this.importMessage = '';
    this.importError = '';
  }

  previewImport(): void {
    if (!this.selectedImportFile) {
      this.importError = 'Please select an Excel file.';
      return;
    }

    this.isPreviewingImport = true;
    this.importPreview = null;
    this.importMessage = '';
    this.importError = '';

    this.bookService.previewInventoryImport(this.selectedImportFile).pipe(
      finalize(() => {
        this.isPreviewingImport = false;
      })
    ).subscribe({
      next: (preview) => {
        this.importPreview = preview;
        this.importMessage = preview.totalRows === 0
          ? 'Preview complete: no rows selected. Enter a quantity for each book you want to import.'
          : `Preview complete: ${preview.validRowCount} valid, ${preview.errorRowCount} error.`;
      },
      error: (err) => {
        this.importError = this.getImportErrorMessage(err, 'Failed to preview import.');
      }
    });
  }

  confirmImport(): void {
    if (!this.importPreview || this.importPreview.errorRowCount > 0 || this.importPreview.validRowCount === 0) {
      return;
    }

    this.isConfirmingImport = true;
    this.importMessage = '';
    this.importError = '';

    this.bookService.confirmInventoryImport(this.importPreview.validRows).pipe(
      finalize(() => {
        this.isConfirmingImport = false;
      })
    ).subscribe({
      next: (response) => {
        const result = response.data;

        if (!response.isSuccess) {
          this.importError = response.message || 'Import failed validation.';
          return;
        }

        this.importMessage = `Imported ${result.importedRows} row(s) successfully.`;
        this.importPreview = null;
        this.selectedImportFile = null;
        this.loadBooks();
        this.loadInventoryHistory();
      },
      error: (err) => {
        this.importError = this.getImportErrorMessage(err, 'Failed to confirm import.');
      }
    });
  }

  updateStock(book: BookAdminDto): void {
    if (!book.id) return;

    const adjustment = this.adjustments[book.id];

    if (book.status === 'Archived') {
      this.error = 'Archived books cannot be adjusted.';
      return;
    }

    if (!adjustment || adjustment.quantity <= 0) {
      this.error = 'Please enter a valid quantity.';
      return;
    }

    if (!adjustment.reasonCategory) {
      this.error = 'Please select a reason category.';
      return;
    }

    if (!adjustment.transactionDate) {
      this.error = 'Please select a transaction date.';
      return;
    }

    const request: StockAdjustmentRequest = {
      type: adjustment.transactionType === 'Increase' ? 'increase' : 'decrease',
      transactionType: adjustment.transactionType,
      quantity: adjustment.quantity,
      reasonCategory: adjustment.reasonCategory,
      notes: adjustment.notes?.trim() || undefined,
      transactionDate: adjustment.transactionDate
    };

    this.updatingBookId = book.id;
    this.error = '';
    this.message = '';

    this.bookService.adjustStock(book.id, request).subscribe({
      next: () => {
        this.message = 'Stock updated successfully.';
        this.error = '';

        this.adjustments[book.id!] = this.createDefaultAdjustment();
        this.updatingBookId = null;

        this.loadBooks();
        this.loadInventoryHistory();
      },
      error: (err) => {
        this.error = err.error?.message || 'Stock update failed.';
        this.message = '';
        this.updatingBookId = null;
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

  getTransactionTypeLabel(value: string): string {
    if (value?.toLowerCase() === 'increase') return 'Increase';
    if (value?.toLowerCase() === 'decrease') return 'Decrease';
    return value || '-';
  }

  get previewRows(): InventoryImportRow[] {
    if (!this.importPreview) return [];
    return [...this.importPreview.validRows, ...this.importPreview.errorRows]
      .sort((a, b) => a.rowNumber - b.rowNumber);
  }

  get selectedManualBook(): BookAdminDto | null {
    if (!this.selectedManualBookId) return null;
    return this.books().find(book => book.id === this.selectedManualBookId) ?? null;
  }

  private createDefaultAdjustment(): StockAdjustment {
    return {
      transactionType: 'Increase',
      quantity: 0,
      reasonCategory: 'New Shipment',
      transactionDate: new Date().toISOString().slice(0, 10),
      notes: ''
    };
  }

  get filteredBooks(): BookAdminDto[] {
    const search = this.inventorySearchText.toLowerCase().trim();

    if (!search) {
      return this.books();
    }

    return this.books().filter(book =>
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search) ||
      (book.isbn || '').toLowerCase().includes(search)
    );
  }

  get manualBookOptions(): BookAdminDto[] {
    return this.filteredBooks.slice(0, 50);
  }

  private getImportErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const serverMessage = err.error?.message || err.error?.Message;

      if (serverMessage) {
        return serverMessage;
      }

      if (err.status === 0) {
        return 'Could not reach the API. Confirm the backend is running on http://localhost:5145.';
      }

      return `${fallback} (${err.status} ${err.statusText})`;
    }

    return fallback;
  }
}
