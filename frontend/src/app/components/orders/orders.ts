import { Component } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { BookService } from '../../services/book';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, AsyncPipe],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent {
  sales$: Observable<any[]>;

  constructor(private bookService: BookService) {
    this.sales$ = this.bookService.sales$;
  }

  getOrderTotal(sale: any): number {
    return (sale?.items ?? []).reduce((total: number, item: any) => {
      const price = item?.price ?? item?.book?.price ?? 0;
      const quantity = item?.quantity ?? 0;
      return total + (price * quantity);
    }, 0);
  }
}