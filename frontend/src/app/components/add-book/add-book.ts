import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService, BookUpsertDto } from '../../services/book';

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

  newBook: BookUpsertDto = {
    title: '',
    author: '',
    category: '',
    isbn: '',
    language: '',
    shortDescription: '',
    longDescription: '',
    coverImageUrl: '',
    sellingPrice: 0,
    costPrice: 0,
    stock: 0,
    status: 'Active',
    isActive: true,
    isFeatured: false,
    isBookOfMonth: false,
    isNewArrival: false,
    isStaffPick: false
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

    if ((this.newBook.sellingPrice ?? 0) < 0) {
      this.error = 'Selling price cannot be negative.';
      return;
    }

    if ((this.newBook.costPrice ?? 0) < 0) {
      this.error = 'Cost price cannot be negative.';
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
          language: '',
          shortDescription: '',
          longDescription: '',
          coverImageUrl: '',
          sellingPrice: 0,
          costPrice: 0,
          stock: 0,
          status: 'Active',
          isActive: true,
          isFeatured: false,
          isBookOfMonth: false,
          isNewArrival: false,
          isStaffPick: false
        };
      },
      error: () => {
        this.error = 'Failed to add book.';
        this.message = '';
      }
    });
  }
}
