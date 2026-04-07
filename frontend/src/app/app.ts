import { Component, signal } from '@angular/core';
import { BookListComponent } from './components/book-list/book-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BookListComponent],
  templateUrl: './app.html',
})
export class AppComponent {}

