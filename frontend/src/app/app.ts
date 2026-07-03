import { Component, OnInit } from '@angular/core';
import { BookListComponent } from './components/book-list/book-list';
import { OrdersComponent } from './components/orders/orders';
import { NewSaleComponent } from './components/new-sale/new-sale';
import { ReceiptComponent } from './components/receipt/receipt';
import { InventoryComponent } from './components/inventory/inventory';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AddBookComponent } from './components/add-book/add-book';
import { ManageBooksComponent } from './components/manage-books/manage-books';
import { CustomersComponent } from './components/customers/customers';
import { HomeFeatureManagementComponent } from './components/home-feature-management/home-feature-management';
import { AppShellComponent } from './components/app-shell/app-shell';
import { AppView } from './components/app-shell/navigation.models';

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
    HomeFeatureManagementComponent,
    AppShellComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  private readonly lastSelectedKey = 'bookSalesLastSelectedMenu';
  currentView: AppView = 'dashboard';

  ngOnInit(): void {
    const savedView = localStorage.getItem(this.lastSelectedKey) as AppView | null;

    if (savedView) {
      this.setView(savedView);
    }
  }

  setView(view: AppView) {
    const placeholders: AppView[] = [
      'returns',
      'stock-history',
      'bulk-import',
      'categories',
      'reports',
      'users',
      'settings',
      'help'
    ];

    if (placeholders.includes(view)) {
      this.currentView = 'dashboard';
      return;
    }

    this.currentView = view;
    localStorage.setItem(this.lastSelectedKey, view);
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

  goFromDashboard(view: Exclude<AppView, 'receipt'>) {
    this.setView(view);
  }
}
