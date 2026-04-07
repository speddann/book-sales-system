import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Book {
  id?: number;
  title: string;
  author: string;
  price: number;
  stock: number;
}

interface ApiResponse {
  isSuccess: boolean;
  message: string;
  data: Book[];
}

export interface CartItem {
  book: Book;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {

  private apiUrl = 'http://localhost:5145/api/books';
  cart: CartItem[] = [];

  constructor(private http: HttpClient) {}

  getBooks(): Observable<Book[]> {
    return this.http.get<ApiResponse>(this.apiUrl).pipe(map(res => res.data));
  }

  addBook(book: Book) {
    return this.http.post(this.apiUrl, book);
  }

  updateBook(id: number, book: Book) {
    return this.http.put(`${this.apiUrl}/${id}`, book);
  }

  deleteBook(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addToCart(book: Book) {
    const item  = this.cart.find(i => i.book.id === book.id);
    if (item ) {
      item.quantity++;
    } else {
      this.cart.push({ book, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(this.cart));
  }


  removeFromCart(bookId: number) {
    this.cart = this.cart.filter(item => item.book.id !== bookId);
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }
  decreaseQuantity(bookId: number) {
    const item = this.cart.find(i => i.book.id === bookId);
    if (item) {
      item.quantity--;
      if (item.quantity <= 0) {
        this.removeFromCart(bookId);
      } else {
        localStorage.setItem('cart', JSON.stringify(this.cart));
      }
    }
  }

  checkout(sale: any) {
    return this.http.post('http://localhost:5145/api/sales', sale);
  }

  getSales() {
    return this.http.get('http://localhost:5145/api/sales');
  }
}
