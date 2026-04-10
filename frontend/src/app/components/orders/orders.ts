import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BookService } from '../../services/book';  

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './orders.html'
})

export class OrdersComponent implements OnInit {

  sales: any[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.bookService.getSales().subscribe((data: any) => {
      this.sales = data.data ?? data;
    });
  }

  getOrderTotal(sale: any): number {
    return (sale?.items ?? []).reduce((total: number, item: any) => {
      const price = item?.price ?? item?.book?.price ?? 0;
      const quantity = item?.quantity ?? 0;
      return total + (price * quantity);
    }, 0);
  }
}
