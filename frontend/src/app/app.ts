import { Component, HostListener } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BookListComponent } from './components/book-list/book-list';
import { OrdersComponent } from './components/orders/orders';
import { BookService } from './services/book';
import { Observable, map } from 'rxjs';
import { NewSaleComponent } from './components/new-sale/new-sale';
import { ReceiptComponent } from './components/receipt/receipt';
import { InventoryComponent } from './components/inventory/inventory';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AddBookComponent } from './components/add-book/add-book';
import { ManageBooksComponent } from './components/manage-books/manage-books';
import { CustomersComponent } from './components/customers/customers';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    BookListComponent,
    OrdersComponent,
    NewSaleComponent,
    ReceiptComponent,
    InventoryComponent,
    DashboardComponent,
    AddBookComponent,
    ManageBooksComponent,
    CustomersComponent,
    AsyncPipe
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  currentView: 'shop' | 'new-sale' | 'orders' | 'receipt' | 'inventory' | 'dashboard' | 'add-book' | 'manage-books' | 'customers' = 'shop';
  isSalesOpen = false;
  isOperationsOpen = false;
  cartCount$: Observable<number>;

  constructor(private bookService: BookService) {
    this.cartCount$ = this.bookService.cart$.pipe(
      map(cart => cart.reduce((total, item) => total + item.quantity, 0))
    );
  }

  setView(view: 'shop' | 'new-sale' | 'orders' | 'receipt' | 'inventory' | 'dashboard' | 'add-book' | 'manage-books' | 'customers') {
    this.currentView = view;
  }

  toggleSales(): void {
    this.isSalesOpen = !this.isSalesOpen;
    if (this.isSalesOpen) {
      this.isOperationsOpen = false;
    }
  }

  closeSales(): void {
    this.isSalesOpen = false;
  }

  toggleOperations(): void {
    this.isOperationsOpen = !this.isOperationsOpen;
    if (this.isOperationsOpen) {
      this.isSalesOpen = false;
    }
  }

  closeOperations(): void {
    this.isOperationsOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.dropdown')) {
      this.isSalesOpen = false;
      this.isOperationsOpen = false;
    }
  }

  goToOrders() {
    this.closeSales();
    this.setView('orders');
  }

  goToNewSale() {
    this.closeSales();
    this.setView('new-sale');
  }

  goToReceipt() {
    this.closeSales();
    this.closeOperations();
    this.setView('receipt');
  }

  goToInventory() {
    this.closeOperations();
    this.setView('inventory');
  }

  goToDashboard() {
    this.closeOperations();
    this.setView('dashboard');
  }
}