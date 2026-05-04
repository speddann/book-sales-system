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

  interface ApiResponse<T> {
    isSuccess: boolean;
    message: string;
    data: T;
  }

  export interface InventoryHistoryItem {
    id: number;
    bookId: number;
    bookTitle: string;
    type: string;
    quantity: number;
    reason: string;
    stockBefore: number;
    stockAfter: number;
    createdDate: string;
  }

  export interface CartItem {
    book: Book;
    quantity: number;
  }

  export interface Customer {
    id?: number;
    name: string;
    phone?: string;
    email?: string;
    createdDate?: string;
  }

  @Injectable({
    providedIn: 'root'
  })
  export class BookService {

    private apiUrl = 'http://localhost:5145/api/books';
    private salesApiUrl = 'http://localhost:5145/api/sales';
    private customersApiUrl = 'http://localhost:5145/api/customers';

    private salesSubject = new BehaviorSubject<any[]>([]);
    sales$ = this.salesSubject.asObservable();

    private cartSubject = new BehaviorSubject<CartItem[]>(this.loadCartFromStorage());
    cart$ = this.cartSubject.asObservable();

    constructor(private http: HttpClient) {}

    getBooks(): Observable<Book[]> {
      return this.http.get<ApiResponse<Book[]>>(this.apiUrl).pipe(map(res => res.data));
    }

    getInventoryHistory(bookId?: number | null, type?: string, startDate?: string, endDate?: string) {
      const params: string[] = [];

      if (bookId) {
        params.push(`bookId=${bookId}`);
      }

      if (type && type !== 'all') {
        params.push(`type=${encodeURIComponent(type)}`);
      }

      if (startDate) {
        params.push(`startDate=${encodeURIComponent(startDate)}`);
      }

      if (endDate) {
        params.push(`endDate=${encodeURIComponent(endDate)}`);
      }

      let url = `${this.apiUrl}/inventory-history`;

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      return this.http.get<InventoryHistoryItem[]>(url);
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

    adjustStock(bookId: number, adjustment: any) {
      return this.http.post(`${this.apiUrl}/${bookId}/stock-adjustment`, adjustment);
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

    getCustomers() {
      return this.http.get<Customer[]>(this.customersApiUrl);
    }

    searchCustomers(term: string) {
      return this.http.get<Customer[]>(`${this.customersApiUrl}/search?term=${encodeURIComponent(term)}`);
    }

    createCustomer(customer: Customer) {
      return this.http.post<Customer>(this.customersApiUrl, customer);
    }

    getSales(startDate?: string, endDate?: string, range?: string) {
      const params: string[] = [];

      if (startDate) {
        params.push(`startDate=${startDate}`);
      }

      if (endDate) {
        params.push(`endDate=${endDate}`);
      }

      if (range) {
        params.push(`range=${range}`);
      }

      let url = this.salesApiUrl;

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      return this.http.get<any>(url);
    }

    loadSales(startDate?: string, endDate?: string, range?: string) {
      this.getSales(startDate, endDate, range).subscribe((data: any) => {
        const sales = data.data ?? data;
        this.salesSubject.next(sales);
      });
    }

    private lastSaleSubject = new BehaviorSubject<any | null>(null);
    lastSale$ = this.lastSaleSubject.asObservable();

    setLastSale(sale: any) {
      this.lastSaleSubject.next(sale);
    }
    
    getCustomerSummary(customerId: number) {
      return this.http.get<any>(`http://localhost:5145/api/customers/${customerId}/summary`);
    }

    getDashboard() {
      return this.http.get<SalesDashboard>(`${this.salesApiUrl}/dashboard`);
    }

    returnSale(saleId: number) {
      return this.http.post<any>(`${this.salesApiUrl}/${saleId}/return`, {});
    }
  }

  export interface TopBook {
    title: string;
    unitsSold: number;
    revenue: number;
  }

  export interface SalesDashboard {
    revenueToday: number;
    revenueThisWeek: number;
    revenueThisMonth: number;
    salesToday: number;
    salesThisWeek: number;
    salesThisMonth: number;
    topBooks: TopBook[];
  }
