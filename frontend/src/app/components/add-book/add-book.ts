import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../services/book';

@Component({
  selector: 'app-add-book',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-book.html',
  styleUrls: ['./add-book.css']
})
export class AddBookComponent {
  categories: string[] = [
    'Spiritual',
    'Self Help',
    'Business',
    'Fiction',
    'Non-Fiction',
    'Biography',
    'Health',
    'Education',
    'Children',
    'Other'
  ];

  newBook: Book = {
    title: '',
    author: '',
    category: '',
    isbn: '',
    description: '',
    imageUrl: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    isActive: true
  };

  message = '';
  error = '';

  constructor(private bookService: BookService) {}

  addBook() {
    if (!this.newBook.title.trim()) {
      this.error = 'Book title is required.';
      return;
    }

    if (!this.newBook.author.trim()) {
      this.error = 'Author is required.';
      return;
    }

    if (this.newBook.price <= 0) {
      this.error = 'Price must be greater than 0.';
      return;
    }

    if (this.newBook.stock < 0) {
      this.error = 'Stock cannot be negative.';
      return;
    }

    this.bookService.addBook(this.newBook).subscribe({
      next: () => {
        this.message = 'Book added successfully.';
        this.error = '';
        this.newBook = {
          title: '',
          author: '',
          category: '',
          isbn: '',
          description: '',
          imageUrl: '',
          price: 0,
          costPrice: 0,
          stock: 0,
          isActive: true
        };
      },
      error: () => {
        this.error = 'Failed to add book.';
        this.message = '';
      }
    });
  }
}
