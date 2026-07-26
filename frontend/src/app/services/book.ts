  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { BehaviorSubject, Observable, map } from 'rxjs';

  export interface BookPublicDto {
    id?: number;
    title: string;
    author: string;
    category?: string;
    isbn?: string;
    language?: string;
    shortDescription?: string;
    longDescription?: string;
    coverImageUrl?: string;
    price?: number;
    sellingPrice?: number;
    stock: number;
    status?: 'Active' | 'Inactive' | 'Archived' | string;
    isFeatured?: boolean;
    isBookOfMonth?: boolean;
    isNewArrival?: boolean;
    isStaffPick?: boolean;
  }

  export interface BookAdminDto extends BookPublicDto {
    costPrice?: number;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
  }

  export interface BookUpsertDto extends BookAdminDto {}

  export type Book = BookAdminDto;

  interface ApiResponse<T> {
    isSuccess: boolean;
    message: string;
    data: T;
  }

  export interface InventoryHistoryItem {
    id: number;
    bookId: number;
    bookTitle: string;
    bookISBN?: string;
    bookCategory?: string;
    bookLanguage?: string;
    type: string;
    transactionType: string;
    quantity: number;
    reason: string;
    reasonCategory: string;
    notes?: string;
    stockBefore: number;
    stockAfter: number;
    transactionDate: string;
    createdDate: string;
  }

  export interface StockAdjustmentRequest {
    type: 'increase' | 'decrease';
    transactionType: 'Increase' | 'Decrease';
    quantity: number;
    reasonCategory: string;
    notes?: string;
    transactionDate?: string;
  }

  export interface InventoryImportRow {
    rowNumber: number;
    isbn: string;
    bookTitle?: string;
    author?: string;
    category?: string;
    language?: string;
    currentStock?: number;
    quantity: number;
    transactionType: string;
    stockAfter?: number;
    reasonCategory: string;
    transactionDate?: string;
    notes?: string;
    status: 'Valid' | 'Error' | string;
    errorMessage?: string;
  }

  export interface InventoryImportError {
    rowNumber: number;
    isbn: string;
    message: string;
  }

  export interface InventoryImportPreviewResponse {
    totalRows: number;
    validRowCount: number;
    errorRowCount: number;
    validRows: InventoryImportRow[];
    errorRows: InventoryImportRow[];
    errors: InventoryImportError[];
  }

  export interface InventoryImportResult {
    totalRows: number;
    validRows: number;
    errorRows: number;
    importedRows: number;
    errors: InventoryImportError[];
  }

  export interface CartItem {
    book: BookPublicDto;
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

    getAdminBooks(): Observable<BookAdminDto[]> {
      return this.http.get<ApiResponse<BookAdminDto[]>>(this.apiUrl).pipe(map(res => res.data));
    }

    getPublicBooks(): Observable<BookPublicDto[]> {
      return this.http.get<ApiResponse<BookPublicDto[]>>(`${this.apiUrl}/public`).pipe(map(res => res.data));
    }

    getBooks(): Observable<BookAdminDto[]> {
      return this.getAdminBooks();
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

    addBook(book: BookUpsertDto) {
      return this.http.post(this.apiUrl, this.prepareBookPayload(book));
    }

    updateBook(id: number, book: BookUpsertDto) {
      return this.http.put(`${this.apiUrl}/${id}`, this.prepareBookPayload(book));
    }

    deleteBook(id: number) {
      return this.http.delete(`${this.apiUrl}/${id}`);
    }

    getCustomers(search: string = '') {
      return this.http.get<Customer[]>(`${this.customersApiUrl}?search=${search}`);
    }

    addCustomer(customer: Customer) {
      return this.http.post<Customer>(this.customersApiUrl, customer);
    }

    updateCustomer(id: number, customer: Customer) {
      return this.http.put<Customer>(`${this.customersApiUrl}/${id}`, customer);
    }

    deleteCustomer(id: number) {
      return this.http.delete(`${this.customersApiUrl}/${id}`);
    }

    getCustomerSummary(id: number) {
      return this.http.get<any>(`${this.customersApiUrl}/${id}/summary`);
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

    addToCart(book: BookPublicDto) {
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

    adjustStock(bookId: number, adjustment: StockAdjustmentRequest) {
      return this.http.post(`${this.apiUrl}/${bookId}/stock-adjustment`, adjustment);
    }

    downloadInventoryImportTemplate(type: 'current' | 'blank' = 'current') {
      return this.http.get(`${this.apiUrl}/inventory-import/template?type=${type}`, {
        responseType: 'blob'
      });
    }

    previewInventoryImport(file: File) {
      const formData = new FormData();
      formData.append('file', file);
      return this.http.post<InventoryImportPreviewResponse>(
        `${this.apiUrl}/inventory-import/preview`,
        formData
      );
    }

    confirmInventoryImport(rows: InventoryImportRow[]) {
      return this.http.post<ApiResponse<InventoryImportResult>>(
        `${this.apiUrl}/inventory-import/confirm`,
        { rows }
      );
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

    emailReceipt(saleId: number, email: string) {
      return this.http.post(`${this.salesApiUrl}/${saleId}/email-receipt`, {
        email
      });
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
    
    getDashboard() {
      return this.http.get<SalesDashboard>(`${this.salesApiUrl}/dashboard`);
    }

    returnSale(saleId: number) {
      return this.http.post<any>(`${this.salesApiUrl}/${saleId}/return`, {});
    }

    getSellingPrice(book: BookPublicDto): number {
      return book.sellingPrice ?? book.price ?? 0;
    }

    getCoverImageUrl(book: BookPublicDto): string {
      const adminBook = book as BookAdminDto;
      return book.coverImageUrl || adminBook.imageUrl || '';
    }

    getShortDescription(book: BookPublicDto): string {
      const adminBook = book as BookAdminDto;
      return book.shortDescription || adminBook.description || '';
    }

    isSellable(book: BookPublicDto): boolean {
      const adminBook = book as BookAdminDto;
      return (book.status ?? (adminBook.isActive === false ? 'Inactive' : 'Active')) === 'Active';
    }

    private prepareBookPayload(book: BookUpsertDto): BookUpsertDto {
      const sellingPrice = this.getSellingPrice(book);
      const status = book.status ?? (book.isActive === false ? 'Inactive' : 'Active');
      const coverImageUrl = this.getCoverImageUrl(book);
      const shortDescription = this.getShortDescription(book);

      return {
        ...book,
        sellingPrice,
        price: sellingPrice,
        status,
        isActive: status === 'Active',
        coverImageUrl,
        imageUrl: coverImageUrl,
        shortDescription,
        description: shortDescription
      };
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
