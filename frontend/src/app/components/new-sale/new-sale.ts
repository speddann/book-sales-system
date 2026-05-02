import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../services/book';
import { DecimalPipe } from '@angular/common';

interface SaleCartItem {
  book: Book;
  quantity: number;
}

@Component({
  selector: 'app-new-sale',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './new-sale.html',
  styleUrls: ['./new-sale.css']
})
export class NewSaleComponent implements OnInit {

  books = signal<Book[]>([]);
  searchText: string = '';
  saleCart: SaleCartItem[] = [];
  paymentMethod: string = 'etransfer';
  checkoutMessage: string = '';
  checkoutError: string = '';
  isCheckingOut: boolean = false;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe(data => {
      this.books.set(data);
    });
  }

  get filteredBooks(): Book[] {
    const search = this.searchText.toLowerCase().trim();

    if (!search) {
      return this.books();
    }

    return this.books().filter(book =>
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search)
    );
  }

  addToSale(book: Book): void {
    if (!book.id) return;

    const existingItem = this.saleCart.find(item => item.book.id === book.id);

    if (existingItem) {
      if (existingItem.quantity < book.stock) {
        existingItem.quantity++;
      } else {
        alert('No more stock available');
      }
    } else {
      this.saleCart.push({
        book,
        quantity: 1
      });
    }
  }

  decreaseQuantity(bookId: number): void {
    const item = this.saleCart.find(x => x.book.id === bookId);

    if (!item) return;

    item.quantity--;

    if (item.quantity <= 0) {
      this.saleCart = this.saleCart.filter(x => x.book.id !== bookId);
    }
  }

  removeItem(bookId: number): void {
    this.saleCart = this.saleCart.filter(x => x.book.id !== bookId);
  }

  getSubtotal(): number {
    return this.saleCart.reduce((total, item) => {
      return total + item.book.price * item.quantity;
    }, 0);
    
  }
      getEtransferFee(): number {
      if (this.paymentMethod !== 'etransfer') {
        return 0;
      }

      return this.getSubtotal() * 0.05;
    }

    getFinalTotal(): number {
      return this.getSubtotal() + this.getEtransferFee();
    }

    completeSale(): void {
      if (this.saleCart.length === 0) {
        this.checkoutError = 'Please add at least one book to complete the sale.';
        return;
      }

      this.isCheckingOut = true;
      this.checkoutMessage = '';
      this.checkoutError = '';

      const sale = {
        paymentMethod: this.paymentMethod,
        items: this.saleCart.map(item => ({
          bookId: item.book.id,
          quantity: item.quantity
        }))
      };

      this.bookService.checkout(sale).subscribe({
        next: () => {
          this.saleCart = [];
          this.searchText = '';
          this.loadBooks();

          this.checkoutMessage = 'Sale completed successfully.';
          this.isCheckingOut = false;

          this.bookService.loadSales();
        },
        error: (err) => {
          this.checkoutError = err.error?.message || 'Sale failed.';
          this.isCheckingOut = false;
        }
      });
}
}