import { Component } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { BookService } from '../../services/book';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe],
  templateUrl: './receipt.html',
  styleUrls: ['./receipt.css']
})
export class ReceiptComponent {
  sale$: Observable<any | null>;

  constructor(private bookService: BookService) {
    this.sale$ = this.bookService.lastSale$;
  }
}