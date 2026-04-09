import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { BookService, Book, CartItem } from '../../services/book';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './book-list.html',
  styleUrls: ['./book-list.css']
})
export class BookListComponent implements OnInit {

  books = signal<Book[]>([]);
  newBook: Book = { title: '', author: '', price: 0, stock: 0 };
  editingBook: Book | null = null;
  showAddForm = false;
  showOrders = false;
  sales = signal<any[]>([]);
  isCheckingOut: boolean = false;
  checkoutMessage: string = '';
  checkoutError: string = ''; 

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.loadBooks();

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      this.bookService.cart = JSON.parse(savedCart);
    }

    this.loadSales();
  }

  loadSales() {
    this.bookService.getSales().subscribe((data: any) => {
      this.sales.set(data.data ?? data);
    });
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
    const item = this.cart.find(i => i.book.id === book.id);

    if (item && item.quantity >= book.stock) {
      alert('No more stock available');
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

  get cart(): CartItem[] {
    return this.bookService.cart;
  }

  getTotalPrice() {
  return this.cart.reduce((total, item) => 
    total + item.book.price * item.quantity, 0);
  
  }

  checkout() {
  if (this.cart.length === 0) return;

  this.isCheckingOut = true;
  this.checkoutMessage = '';
  this.checkoutError = '';

  const sale = {
    items: this.cart.map(item => ({
      bookId: item.book.id,
      quantity: item.quantity
    }))
  };

  this.bookService.checkout(sale).subscribe({
    next: () => {
      this.cart = [];
      localStorage.removeItem('cart');
      this.loadBooks();

      this.checkoutMessage = 'Order placed successfully!';
      this.isCheckingOut = false;
    },
    error: (err) => {
      this.checkoutError = err.error?.message || 'Checkout failed';
      this.isCheckingOut = false;
    }
  });
}




}
