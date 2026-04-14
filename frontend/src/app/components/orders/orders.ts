import { Component, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, AsyncPipe, FormsModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent  implements OnInit {
  sales$: Observable<any[]>;
  startDate: string = '';
  endDate: string = '';

  constructor(private bookService: BookService) {
    this.sales$ = this.bookService.sales$;
  }

    ngOnInit(): void {
    this.bookService.loadSales();
  }

  applyFilter(): void {
    this.bookService.loadSales(this.startDate, this.endDate);
  }

  clearFilter(): void {
    this.startDate = '';
    this.endDate = '';
    this.bookService.loadSales();
  }

  getOrderTotal(sale: any): number {
    return (sale?.items ?? []).reduce((total: number, item: any) => {
      const price = item?.price ?? item?.book?.price ?? 0;
      const quantity = item?.quantity ?? 0;
      return total + (price * quantity);
    }, 0);
  }
}