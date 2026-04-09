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
}
