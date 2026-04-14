import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BookListComponent } from './components/book-list/book-list';
import { OrdersComponent } from './components/orders/orders';
import { BookService } from './services/book';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BookListComponent, OrdersComponent, AsyncPipe],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  view: 'shop' | 'orders' = 'shop';
  cartCount$: Observable<number>;

  constructor(private bookService: BookService) {
    this.cartCount$ = this.bookService.cart$.pipe(
      map(cart => cart.reduce((total, item) => total + item.quantity, 0))
    );
  }

  ngOnInit() {
    this.bookService.loadSales();
  }

  goToOrders() {
    
    this.bookService.loadSales();
    this.view = 'orders';
  }
}