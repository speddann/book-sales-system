import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService, Book, Customer } from '../../services/book';
import { DatePipe, DecimalPipe } from '@angular/common';

interface SaleCartItem {
  book: Book;
  quantity: number;
}

@Component({
  selector: 'app-new-sale',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './new-sale.html',
  styleUrls: ['./new-sale.css']
})
export class NewSaleComponent implements OnInit {
  @Output() saleCompleted = new EventEmitter<void>();

  books = signal<Book[]>([]);
  customers = signal<Customer[]>([]);
  searchText: string = '';
  customerSearchText: string = '';
  selectedCustomer: Customer | null = null;
  saleCart: SaleCartItem[] = [];
  paymentMethod: string = 'etransfer';
  paymentStatus: string = 'Paid';
  paymentReference: string = '';
  checkoutMessage: string = '';
  checkoutError: string = '';
  isCheckingOut: boolean = false;
  customerSummary: any = null;
  showNewCustomerForm: boolean = false;
  lastCompletedSale: any = null;
  receiptEmail = '';
  isEmailingReceipt = false;
  receiptEmailMessage = '';
  receiptEmailError = '';

  newCustomer: Customer = {
    name: '',
    phone: '',
    email: ''
  };

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  onCustomerSearchChange(): void {
    const term = this.customerSearchText.trim();

    if (!term) {
      this.customers.set([]);
      this.selectedCustomer = null;
      return;
    }

    this.bookService.getCustomers(term).subscribe((customers: Customer[]) => {
      this.customers.set(customers);
    });
  }

  selectCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.customerSearchText = customer.name;
    this.customers.set([]);
    this.showNewCustomerForm = false;
    this.bookService.getCustomerSummary(customer.id!).subscribe(summary => {
      this.customerSummary = summary;
    });
  }

  createCustomerFromSale(): void {
    if (!this.newCustomer.name.trim()) {
      this.checkoutError = 'Customer name is required.';
      return;
    }

    this.bookService.addCustomer(this.newCustomer).subscribe({
      next: (createdCustomer) => {
        this.selectedCustomer = createdCustomer;
        this.customerSearchText = createdCustomer.name;
        this.customers.set([]);
        this.customerSummary = null;

        this.newCustomer = {
          name: '',
          phone: '',
          email: ''
        };

        this.showNewCustomerForm = false;
        this.checkoutError = '';
        this.checkoutMessage = 'Customer added and selected.';
      },
      error: () => {
        this.checkoutError = 'Failed to add customer.';
        this.checkoutMessage = '';
      }
    });
  }

  clearCustomer(): void {
    this.selectedCustomer = null;
    this.customerSearchText = '';
    this.customerSummary = null;
    this.showNewCustomerForm = false;
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe(data => {
      this.books.set(data.filter(book => book.isActive !== false));
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

    if (book.isActive === false) {
      alert('This book is inactive and cannot be sold.');
      return;
    }

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
      paymentStatus: this.paymentStatus,
      paymentReference: this.paymentReference,
      customerId: this.selectedCustomer?.id ?? null,
      items: this.saleCart.map(item => ({
        bookId: item.book.id,
        quantity: item.quantity
      }))
    };

    this.bookService.checkout(sale).subscribe({
      next: (response: any) => {
        const savedSale = response?.data ?? response;

        const receiptCustomer = this.selectedCustomer
          ? { ...this.selectedCustomer }
          : null;

        const receiptItems = this.saleCart.map(item => ({
          title: item.book.title,
          quantity: item.quantity,
          price: item.book.price,
          total: item.book.price * item.quantity
        }));

        this.lastCompletedSale = {
          ...savedSale,
          id: savedSale.id ?? savedSale.saleId,
          paymentStatus: savedSale.paymentStatus ?? this.paymentStatus,
          paymentReference: savedSale.paymentReference ?? this.paymentReference,
          receiptCustomer,
          receiptItems
        };
        this.receiptEmail = receiptCustomer?.email || '';
        this.receiptEmailMessage = '';
        this.receiptEmailError = '';

        this.bookService.setLastSale(this.lastCompletedSale);
        this.saleCart = [];
        this.searchText = '';
        this.paymentStatus = 'Paid';
        this.paymentReference = '';
        this.clearCustomer();
        this.loadBooks();

        this.isCheckingOut = false;
        this.checkoutMessage = 'Sale completed successfully.';
        this.bookService.loadSales();
      },
      error: (err) => {
        this.checkoutError = err.error?.message || 'Sale failed.';
        this.isCheckingOut = false;
      }
    });
  }

  printReceipt(): void {
    window.print();
  }

  emailReceipt(): void {
    if (!this.lastCompletedSale?.id) return;

    if (!this.receiptEmail.trim()) {
      this.receiptEmailError = 'Please enter customer email.';
      return;
    }

    this.isEmailingReceipt = true;
    this.receiptEmailMessage = '';
    this.receiptEmailError = '';

    this.bookService.emailReceipt(
      this.lastCompletedSale.id,
      this.receiptEmail
    ).subscribe({
      next: () => {
        this.receiptEmailMessage = 'Receipt emailed successfully.';
        this.isEmailingReceipt = false;
      },
      error: () => {
        this.receiptEmailError = 'Failed to email receipt.';
        this.isEmailingReceipt = false;
      }
    });
  }
}
