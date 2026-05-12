import { Component, OnInit, signal } from '@angular/core';
import { EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { BookService, Book, CartItem } from '../../services/book';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [FormsModule, AsyncPipe, DecimalPipe],
  templateUrl: './book-list.html',
  styleUrls: ['./book-list.css']
})

export class BookListComponent implements OnInit {

  @Output() checkoutSuccess = new EventEmitter<void>();

  books = signal<Book[]>([]);
  cart$: Observable<CartItem[]>;
  showOrders = false;
  sales$: Observable<any[]>;
  isCheckingOut: boolean = false;
  checkoutMessage: string = '';
  checkoutError: string = '';
  selectedBook: Book | null = null;
  searchText: string = '';
  selectedCategory: string = 'all';
  sortBy: string = 'title-asc';
  pageSize: number = 20;
  currentPage: number = 1;

  constructor(private bookService: BookService) {
    this.sales$ = this.bookService.sales$;
    this.cart$ = this.bookService.cart$;
  }

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.bookService.getBooks().subscribe(data => {
      this.books.set(data.filter(book => book.isActive !== false));
      this.currentPage = 1;
    });
  }

  get categories(): string[] {
    const categories = this.books()
      .map(book => book.category)
      .filter((category): category is string => !!category && category.trim() !== '');

    return [...new Set(categories)];
  }

  get filteredBooks(): Book[] {
    let result = this.books().filter(book => book.isActive !== false);

    const search = this.searchText.toLowerCase().trim();

    if (search) {
      result = result.filter(book =>
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search) ||
        (book.isbn || '').toLowerCase().includes(search)
      );
    }

    if (this.selectedCategory !== 'all') {
      result = result.filter(book => book.category === this.selectedCategory);
    }

    result = [...result].sort((a, b) => {
      switch (this.sortBy) {
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'author-asc':
          return a.author.localeCompare(b.author);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'stock-low':
          return a.stock - b.stock;
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredBooks.length);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredBooks.length / this.pageSize) || 1;
  }

  get pagedBooks(): Book[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBooks.slice(start, start + this.pageSize);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  resetPage(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedCategory = 'all';
    this.sortBy = 'title-asc';
    this.pageSize = 20;
    this.currentPage = 1;
  }

  addToCart(book: Book) {
    if (book.isActive === false) {
      alert('This book is inactive and cannot be sold.');
      return;
    }

    this.bookService.addToCart(book);
  }

  decreaseQuantity(id: number) {
    this.bookService.decreaseQuantity(id);
  }

  removeFromCart(id: number) {
    this.bookService.removeFromCart(id);
  }

  openDetail(book: Book) {
    this.selectedBook = book;
  }

  closeDetail() {
    this.selectedBook = null;
  }

  removeItemFromCart(item: CartItem) {
    if (item.book.id == null) return;
    this.removeFromCart(item.book.id);
  }

  decreaseCartItem(item: CartItem) {
    if (item.book.id == null) return;
    this.decreaseQuantity(item.book.id);
  }

  getTotalPrice(cart: CartItem[]) {
    return cart.reduce((total, item) => total + item.book.price * item.quantity, 0);
  }

  checkout() {
    const cart = this.bookService.getCurrentCart();
    if (cart.length === 0) return;

    this.isCheckingOut = true;
    this.checkoutMessage = '';
    this.checkoutError = '';

    const sale = {
      items: cart.map(item => ({
        bookId: item.book.id,
        quantity: item.quantity
      }))
    };

    this.bookService.checkout(sale).subscribe({
      next: (response: any) => {
        const savedSale = response?.data ?? response;
        this.bookService.setLastSale(savedSale);
        this.bookService.clearCart();
        this.loadBooks();
        this.bookService.loadSales();

        this.checkoutMessage = 'Order placed successfully!';
        this.isCheckingOut = false;
        this.checkoutSuccess.emit();
      },
      error: (err) => {
        this.checkoutError = err.error?.message || 'Checkout failed';
        this.isCheckingOut = false;
      }
    });
  }
}
