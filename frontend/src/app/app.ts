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
    AsyncPipe
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  view: 'shop' | 'new-sale' | 'orders' | 'receipt' | 'inventory' | 'dashboard' = 'shop';
  cartCount$: Observable<number>;

  constructor(private bookService: BookService) {
    this.cartCount$ = this.bookService.cart$.pipe(
      map(cart => cart.reduce((total, item) => total + item.quantity, 0))
    );
  }

  goToOrders() {
    this.view = 'orders';
  }

  goToNewSale() {
    this.view = 'new-sale';
  }

  goToReceipt() {
    this.view = 'receipt';
  }

  goToInventory() {
    this.view = 'inventory';
  }

  goToDashboard() {
    this.view = 'dashboard';
  }
}