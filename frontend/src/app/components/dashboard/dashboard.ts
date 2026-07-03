import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookAdminDto, BookService, SalesDashboard, TopBook } from '../../services/book';
import { DashboardStatCardComponent } from './widgets/dashboard-stat-card';
import { DashboardActionTileComponent } from './widgets/dashboard-action-tile';
import { DashboardPanelComponent } from './widgets/dashboard-panel';

type DashboardView =
  | 'new-sale'
  | 'add-book'
  | 'inventory'
  | 'customers'
  | 'orders'
  | 'manage-books'
  | 'home-features'
  | 'shop'
  | 'dashboard';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  view: DashboardView;
}

interface HealthMetric {
  label: string;
  value: string;
  detail: string;
  tone: 'good' | 'warning' | 'neutral';
}

interface ActivityItem {
  title: string;
  detail: string;
  time: string;
}

interface RecentSale {
  orderNo: string;
  customer: string;
  amount: number;
  paymentMethod: string;
  status: string;
  time: string;
}

interface Reminder {
  title: string;
  detail: string;
  due: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    DashboardStatCardComponent,
    DashboardActionTileComponent,
    DashboardPanelComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  @Output() navigate = new EventEmitter<DashboardView>();

  dashboard = signal<SalesDashboard | null>(null);
  books = signal<BookAdminDto[]>([]);
  recentSales = signal<RecentSale[]>([]);
  loading = signal(true);
  error = signal('');

  today = new Date();
  lastSyncTime = new Date();
  ownerNotes = '';

  readonly quickActions: QuickAction[] = [
    { title: 'New Sale', description: 'Open the POS checkout', icon: '+', view: 'new-sale' },
    { title: 'Add Book', description: 'Create a catalog item', icon: 'B', view: 'add-book' },
    { title: 'Receive Inventory', description: 'Adjust stock levels', icon: 'I', view: 'inventory' },
    { title: 'Customers', description: 'Search customer records', icon: 'C', view: 'customers' },
    { title: 'Reports', description: 'Review sales history', icon: 'R', view: 'orders' },
    { title: 'Home Features', description: 'Control customer home content', icon: 'H', view: 'home-features' },
    { title: 'Settings', description: 'Store setup placeholder', icon: 'S', view: 'dashboard' }
  ];

  readonly healthMetrics: HealthMetric[] = [
    { label: 'Business Health Score', value: '82', detail: 'Stable operations', tone: 'good' },
    { label: 'Inventory Health', value: '74%', detail: 'Low stock needs attention', tone: 'warning' },
    { label: 'Sales Health', value: 'Good', detail: 'Sales pace is steady', tone: 'good' },
    { label: 'Customer Health', value: 'New', detail: 'CRM scoring planned', tone: 'neutral' },
    { label: 'Return Health', value: 'Low', detail: 'Return volume placeholder', tone: 'good' }
  ];

  readonly activityItems: ActivityItem[] = [
    { title: 'Sale completed', detail: 'POS checkout finished successfully', time: '12 min ago' },
    { title: 'Inventory updated', detail: 'Manual stock adjustment recorded', time: '38 min ago' },
    { title: 'Book added', detail: 'New catalog item created', time: 'Today' },
    { title: 'Book edited', detail: 'Catalog details refreshed', time: 'Yesterday' },
    { title: 'Promotion created', detail: 'Homepage feature placeholder', time: 'Planned' },
    { title: 'Return processed', detail: 'Return workflow placeholder', time: 'Planned' }
  ];

  readonly reminders: Reminder[] = [
    { title: 'Promotion ending soon', detail: 'Review featured books this week', due: 'Today' },
    { title: 'Low stock', detail: 'Check reorder suggestions', due: 'Today' },
    { title: 'Inventory count', detail: 'Schedule physical count adjustment', due: 'This week' },
    { title: 'Pending returns', detail: 'Review recent order returns', due: 'Later' }
  ];

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.ownerNotes = localStorage.getItem('dashboardOwnerNotes') || '';
    this.loadDashboard();
    this.loadBooks();
    this.loadRecentSales();
  }

  loadDashboard() {
    this.loading.set(true);
    this.error.set('');

    this.bookService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.lastSyncTime = new Date();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard. Is the backend running?');
        this.loading.set(false);
      }
    });
  }

  loadBooks() {
    this.bookService.getAdminBooks().subscribe({
      next: (books) => this.books.set(books),
      error: () => this.books.set([])
    });
  }

  loadRecentSales() {
    this.bookService.getSales().subscribe({
      next: (response: any) => {
        const sales = response?.data ?? response ?? [];
        const mapped = Array.isArray(sales)
          ? sales.slice(0, 5).map((sale: any, index: number) => ({
              orderNo: sale.orderNumber || sale.receiptNumber || `#${sale.id ?? index + 1}`,
              customer: sale.customerName || sale.customer?.name || 'Walk-in',
              amount: sale.totalAmount ?? sale.total ?? sale.amount ?? 0,
              paymentMethod: sale.paymentMethod || 'Card',
              status: sale.status || 'Paid',
              time: sale.saleDate || sale.createdDate || new Date().toISOString()
            }))
          : [];

        this.recentSales.set(mapped.length ? mapped : this.placeholderSales());
      },
      error: () => this.recentSales.set(this.placeholderSales())
    });
  }

  saveOwnerNotes() {
    localStorage.setItem('dashboardOwnerNotes', this.ownerNotes);
  }

  go(view: DashboardView) {
    this.navigate.emit(view);
  }

  formatCurrency(value: number | undefined | null): string {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 2
    }).format(value ?? 0);
  }

  get lowStockBooks(): BookAdminDto[] {
    return this.books()
      .filter(book => book.stock <= 5)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }

  get topBooks(): TopBook[] {
    return this.dashboard()?.topBooks ?? [];
  }

  get businessCardValues() {
    const d = this.dashboard();

    return [
      {
        title: 'Revenue Today',
        value: this.formatCurrency(d?.revenueToday),
        comparison: 'Live from sales dashboard',
        icon: '$',
        view: 'orders' as DashboardView
      },
      {
        title: 'Revenue This Week',
        value: this.formatCurrency(d?.revenueThisWeek),
        comparison: 'Compared once history matures',
        icon: 'UP',
        view: 'orders' as DashboardView
      },
      {
        title: 'Revenue This Month',
        value: this.formatCurrency(d?.revenueThisMonth),
        comparison: 'Monthly run rate',
        icon: 'M',
        view: 'orders' as DashboardView
      },
      {
        title: 'Orders Today',
        value: String(d?.salesToday ?? 0),
        comparison: `${d?.salesThisWeek ?? 0} this week`,
        icon: '#',
        view: 'orders' as DashboardView
      },
      {
        title: 'Profit Today',
        value: 'Pending',
        comparison: 'Cost reporting planned',
        icon: 'P',
        view: 'dashboard' as DashboardView
      },
      {
        title: 'Inventory Value',
        value: 'Pending',
        comparison: 'Inventory valuation planned',
        icon: 'I',
        view: 'inventory' as DashboardView
      }
    ];
  }

  getSuggestedReorder(stock: number): number {
    return Math.max(20 - stock, 10);
  }

  private placeholderSales(): RecentSale[] {
    return [
      { orderNo: '#1024', customer: 'Walk-in', amount: 48.5, paymentMethod: 'Card', status: 'Paid', time: new Date().toISOString() },
      { orderNo: '#1023', customer: 'Member customer', amount: 32, paymentMethod: 'Cash', status: 'Paid', time: new Date().toISOString() },
      { orderNo: '#1022', customer: 'Walk-in', amount: 18.99, paymentMethod: 'Card', status: 'Paid', time: new Date().toISOString() }
    ];
  }
}
