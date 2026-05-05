import { Component } from '@angular/core';
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
  cartCount$: Observable<number>;

  constructor(private bookService: BookService) {
    this.cartCount$ = this.bookService.cart$.pipe(
      map(cart => cart.reduce((total, item) => total + item.quantity, 0))
    );
  }

  setView(view: 'shop' | 'new-sale' | 'orders' | 'receipt' | 'inventory' | 'dashboard' | 'add-book' | 'manage-books' | 'customers') {
    this.currentView = view;
  }

  goToOrders() {
    this.setView('orders');
  }

  goToNewSale() {
    this.setView('new-sale');
  }

  goToReceipt() {
    this.setView('receipt');
  }

  goToInventory() {
    this.setView('inventory');
  }

  goToDashboard() {
    this.setView('dashboard');
  }
}