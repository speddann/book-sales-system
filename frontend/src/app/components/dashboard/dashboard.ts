import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { BookService, SalesDashboard } from '../../services/book';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  dashboard = signal<SalesDashboard | null>(null);
  loading = signal(true);
  error = signal('');

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.bookService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard. Is the backend running?');
        this.loading.set(false);
      }
    });
  }
}
