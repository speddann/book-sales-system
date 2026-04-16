  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { BehaviorSubject, Observable, map } from 'rxjs';

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
    private salesApiUrl = 'http://localhost:5145/api/sales';

    private salesSubject = new BehaviorSubject<any[]>([]);
    sales$ = this.salesSubject.asObservable();

    private cartSubject = new BehaviorSubject<CartItem[]>(this.loadCartFromStorage());
    cart$ = this.cartSubject.asObservable();

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

    private loadCartFromStorage(): CartItem[] {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }

    private saveCart(cart: CartItem[]) {
      localStorage.setItem('cart', JSON.stringify(cart));
      this.cartSubject.next(cart);
    }

    getCurrentCart(): CartItem[] {
      return this.cartSubject.getValue();
    }

    addToCart(book: Book) {
      const cart = this.getCurrentCart();
      const item = cart.find(i => i.book.id === book.id);

      if (item) {
        if (item.quantity < book.stock) {
          item.quantity++;
        } else {
          alert('No more stock available');
        }
      } else {
        cart.push({ book, quantity: 1 });
      }

      this.saveCart([...cart]);
    }

    decreaseQuantity(bookId: number) {
      const cart = this.getCurrentCart();
      const item = cart.find(i => i.book.id === bookId);

      if (item) {
        item.quantity--;

        if (item.quantity <= 0) {
          const updatedCart = cart.filter(i => i.book.id !== bookId);
          this.saveCart(updatedCart);
          return;
        }
      }

      this.saveCart([...cart]);
    }

    removeFromCart(bookId: number) {
      const updatedCart = this.getCurrentCart().filter(i => i.book.id !== bookId);
      this.saveCart(updatedCart);
    }

    clearCart() {
      localStorage.removeItem('cart');
      this.cartSubject.next([]);
    }

    getCartCount(): number {
      return this.getCurrentCart().reduce((total, item) => total + item.quantity, 0);
    }

    checkout(sale: any) {
      return this.http.post(this.salesApiUrl, sale);
    }

    getSales(startDate?: string, endDate?: string) {
      const params: string[] = [];

      if (startDate) {
        params.push(`startDate=${startDate}`);
      }

      if (endDate) {
        params.push(`endDate=${endDate}`);
      }

      let url = this.salesApiUrl;

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      return this.http.get<any>(url);
    }

    loadSales(startDate?: string, endDate?: string) {
      this.getSales(startDate, endDate).subscribe((data: any) => {
        const sales = data.data ?? data;
        this.salesSubject.next(sales);
      });
    }
    
  }
