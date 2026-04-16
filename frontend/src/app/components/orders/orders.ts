import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book';
import { Observable } from 'rxjs';

type DateFilterOption =
  | 'last7days'
  | 'last30days'
  | 'last3months'
  | 'thisMonth'
  | '2026'
  | '2025'
  | 'all'
  | 'custom';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, AsyncPipe, FormsModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit {
  sales$: Observable<any[]>;
  startDate: string = '';
  endDate: string = '';
  showFilterPanel: boolean = false;
  selectedDateFilter: DateFilterOption = 'last7days';
  activeFilterLabel: string = 'Last 7 Days';

  constructor(private bookService: BookService) {
    this.sales$ = this.bookService.sales$;
  }

  ngOnInit(): void {
    this.applySelectedFilter();
  }

  openFilterPanel(): void {
    this.showFilterPanel = true;
  }

  closeFilterPanel(): void {
    this.showFilterPanel = false;
  }

  applyFilter(): void {
    this.applySelectedFilter();
    this.closeFilterPanel();
  }

  clearFilter(): void {
    this.selectedDateFilter = 'last7days';
    this.applySelectedFilter();
  }

  getOrderTotal(sale: any): number {
    return (sale?.items ?? []).reduce((total: number, item: any) => {
      const price = item?.price ?? item?.book?.price ?? 0;
      const quantity = item?.quantity ?? 0;
      return total + (price * quantity);
    }, 0);
  }

  private applySelectedFilter(): void {
    const today = new Date();

    switch (this.selectedDateFilter) {
      case 'last7days': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        this.startDate = this.formatDate(sevenDaysAgo);
        this.endDate = '';
        this.activeFilterLabel = 'Last 7 Days';
        break;
      }

      case 'last30days': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        this.startDate = this.formatDate(thirtyDaysAgo);
        this.endDate = '';
        this.activeFilterLabel = 'Last 30 Days';
        break;
      }

      case 'last3months': {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);

        this.startDate = this.formatDate(threeMonthsAgo);
        this.endDate = '';
        this.activeFilterLabel = 'Last 3 Months';
        break;
      }

      case 'thisMonth': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        this.startDate = this.formatDate(firstDay);
        this.endDate = '';
        this.activeFilterLabel = 'This Month';
        break;
      }

      case '2026': {
        this.startDate = '2026-01-01';
        this.endDate = '2026-12-31';
        this.activeFilterLabel = '2026';
        break;
      }

      case '2025': {
        this.startDate = '2025-01-01';
        this.endDate = '2025-12-31';
        this.activeFilterLabel = '2025';
        break;
      }

      case 'custom': {
        this.activeFilterLabel = this.getCustomFilterLabel();
        break;
      }
    }

    this.bookService.loadSales(this.startDate, this.endDate);
  }

  private getCustomFilterLabel(): string {
    if (this.startDate && this.endDate) {
      return `Custom: ${this.startDate} to ${this.endDate}`;
    }

    if (this.startDate) {
      return `Custom: from ${this.startDate}`;
    }

    if (this.endDate) {
      return `Custom: up to ${this.endDate}`;
    }

    return 'Custom Range';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}