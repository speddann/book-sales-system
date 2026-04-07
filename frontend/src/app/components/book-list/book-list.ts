import { Component, OnInit } from '@angular/core';
import { NgFor } from '@angular/common';
import { BookService, Book } from '../../services/book';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [NgFor],
  templateUrl: './book-list.html',
  styleUrls: ['./book-list.css']
})
export class BookListComponent implements OnInit {

  books: Book[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.bookService.getBooks().subscribe(data => {
      this.books = data;
    });
  }
}
