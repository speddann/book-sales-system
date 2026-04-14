import { Component, OnInit, signal } from '@angular/core';
import { EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { BookService, Book, CartItem } from '../../services/book';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [FormsModule, DatePipe, AsyncPipe],
  templateUrl: './book-list.html',
  styleUrls: ['./book-list.css']
})

export class BookListComponent implements OnInit {

  @Output() checkoutSuccess = new EventEmitter<void>();

  books = signal<Book[]>([]);
  cart$: Observable<CartItem[]>;
  newBook: Book = { title: '', author: '', price: 0, stock: 0 };
  editingBook: Book | null = null;
  showAddForm = false;
  showOrders = false;
  sales$: Observable<any[]>;
  isCheckingOut: boolean = false;
  checkoutMessage: string = '';
  checkoutError: string = ''; 

  constructor(private bookService: BookService) {
    this.sales$ = this.bookService.sales$;
    this.cart$ = this.bookService.cart$;
  }

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.bookService.getBooks().subscribe(data => {
      this.books.set(data);
    });
  }

  addBook() {
    this.bookService.addBook(this.newBook).subscribe(() => {
      this.loadBooks(); // Refresh the list after adding a book
      this.newBook = { title: '', author: '', price: 0, stock: 0 }; // Reset the form
    });
  }
  
  editBook(book: Book) {
    this.editingBook = { ...book };
  }
  updateBook() {
    if (!this.editingBook) return;
    this.bookService.updateBook(this.editingBook.id!, this.editingBook).subscribe(() => {
      this.loadBooks(); // Refresh the list after updating a book
      this.editingBook = null; // Exit edit mode
    });
  }

  deleteBook(id: number) {
    this.bookService.deleteBook(id).subscribe(() => {
      this.loadBooks();
    });
  }

  addToCart(book: Book) {
    this.bookService.addToCart(book);
  }

  decreaseQuantity(id: number) {
    this.bookService.decreaseQuantity(id);
  }

  removeFromCart(id: number) {
    this.bookService.removeFromCart(id);
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
    next: () => {
      this.bookService.clearCart();
      this.loadBooks();
      this.bookService.loadSales();

      this.checkoutMessage = 'Order placed successfully!';
      this.isCheckingOut = false;
      console.log('checkout success emit');
      this.checkoutSuccess.emit();
    },
    error: (err) => {
      this.checkoutError = err.error?.message || 'Checkout failed';
      this.isCheckingOut = false;
    }
  });
}




}
