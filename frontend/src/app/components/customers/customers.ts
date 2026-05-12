import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { BookService, Customer } from '../../services/book';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css']
})
export class CustomersComponent implements OnInit {
  customers = signal<Customer[]>([]);
  searchText = '';
  sortBy = 'name-asc';
  pageSize = 10;
  currentPage = 1;
  historyStartDate = '';
  historyEndDate = '';
  historySortBy = 'newest';
  historyPageSize = 5;
  historyCurrentPage = 1;

  newCustomer: Customer = {
    name: '',
    phone: '',
    email: ''
  };

  editingCustomer: Customer | null = null;
  selectedCustomerSummary: any = null;

  message = '';
  error = '';

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.bookService.getCustomers(this.searchText).subscribe({
      next: data => {
        this.customers.set(data);
      },
      error: () => {
        this.error = 'Failed to load customers.';
      }
    });
  }

  searchCustomers(): void {
    this.loadCustomers();
  }

  get sortedCustomers(): Customer[] {
    let result = [...this.customers()];

    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.createdDate || '').getTime() -
                 new Date(a.createdDate || '').getTime();
        case 'oldest':
          return new Date(a.createdDate || '').getTime() -
                 new Date(b.createdDate || '').getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }

  get pagedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedCustomers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.sortedCustomers.length / this.pageSize) || 1;
  }

  get startItem(): number {
    if (this.sortedCustomers.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.sortedCustomers.length
    );
  }

  addCustomer(): void {
    if (!this.newCustomer.name.trim()) {
      this.error = 'Customer name is required.';
      return;
    }

    this.bookService.addCustomer(this.newCustomer).subscribe({
      next: () => {
        this.message = 'Customer added successfully.';
        this.error = '';
        this.newCustomer = {
          name: '',
          phone: '',
          email: ''
        };
        this.loadCustomers();
      },
      error: () => {
        this.error = 'Failed to add customer.';
        this.message = '';
      }
    });
  }

  editCustomer(customer: Customer): void {
    this.editingCustomer = { ...customer };
    this.message = '';
    this.error = '';
  }

  cancelEdit(): void {
    this.editingCustomer = null;
  }

  updateCustomer(): void {
    if (!this.editingCustomer?.id) return;

    this.bookService.updateCustomer(this.editingCustomer.id, this.editingCustomer).subscribe({
      next: () => {
        this.message = 'Customer updated successfully.';
        this.error = '';
        this.editingCustomer = null;
        this.loadCustomers();
      },
      error: () => {
        this.error = 'Failed to update customer.';
        this.message = '';
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    if (!customer.id) return;

    const confirmed = confirm(`Delete customer "${customer.name}"?`);

    if (!confirmed) return;

    this.bookService.deleteCustomer(customer.id).subscribe({
      next: () => {
        this.message = 'Customer deleted successfully.';
        this.error = '';
        this.selectedCustomerSummary = null;
        this.loadCustomers();
      },
      error: () => {
        this.error = 'Failed to delete customer.';
        this.message = '';
      }
    });
  }

  viewSummary(customer: Customer): void {
    if (!customer.id) return;

    this.bookService.getCustomerSummary(customer.id).subscribe({
      next: summary => {
        this.selectedCustomerSummary = summary;
        this.clearHistoryFilters();
      },
      error: () => {
        this.error = 'Failed to load customer summary.';
      }
    });
  }

  get filteredCustomerOrders(): any[] {
    if (!this.selectedCustomerSummary?.orders) {
      return [];
    }

    let result = [...this.selectedCustomerSummary.orders];

    if (this.historyStartDate) {
      const start = new Date(this.historyStartDate);
      result = result.filter(order => new Date(order.date) >= start);
    }

    if (this.historyEndDate) {
      const end = new Date(this.historyEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(order => new Date(order.date) <= end);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      return this.historySortBy === 'oldest'
        ? dateA - dateB
        : dateB - dateA;
    });

    return result;
  }

  get pagedCustomerOrders(): any[] {
    const start = (this.historyCurrentPage - 1) * this.historyPageSize;
    return this.filteredCustomerOrders.slice(start, start + this.historyPageSize);
  }

  get historyTotalPages(): number {
    return Math.ceil(this.filteredCustomerOrders.length / this.historyPageSize) || 1;
  }

  get historyStartItem(): number {
    if (this.filteredCustomerOrders.length === 0) return 0;
    return (this.historyCurrentPage - 1) * this.historyPageSize + 1;
  }

  get historyEndItem(): number {
    return Math.min(
      this.historyCurrentPage * this.historyPageSize,
      this.filteredCustomerOrders.length
    );
  }

  goToPreviousHistoryPage(): void {
    if (this.historyCurrentPage > 1) {
      this.historyCurrentPage--;
    }
  }

  goToNextHistoryPage(): void {
    if (this.historyCurrentPage < this.historyTotalPages) {
      this.historyCurrentPage++;
    }
  }

  resetHistoryPage(): void {
    this.historyCurrentPage = 1;
  }

  clearHistoryFilters(): void {
    this.historyStartDate = '';
    this.historyEndDate = '';
    this.historySortBy = 'newest';
    this.historyPageSize = 5;
    this.historyCurrentPage = 1;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  resetPage(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchText = '';
    this.sortBy = 'name-asc';
    this.pageSize = 10;
    this.currentPage = 1;
    this.loadCustomers();
  }

  clearSearch(): void {
    this.searchText = '';
    this.loadCustomers();
  }
}
