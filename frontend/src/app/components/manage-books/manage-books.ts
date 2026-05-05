import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService, Book } from '../../services/book';

@Component({
  selector: 'app-manage-books',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './manage-books.html',
  styleUrls: ['./manage-books.css']
})
export class ManageBooksComponent implements OnInit {
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

  books = signal<Book[]>([]);
  editingBook: Book | null = null;
  searchText = '';
  selectedCategory = 'all';
  statusFilter = 'all';
  sortBy = 'title-asc';
  message = '';
  error = '';

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.bookService.getBooks().subscribe(data => {
      this.books.set(data);
    });
  }

  get filteredBooks(): Book[] {
    let result = this.books();

    const search = this.searchText.toLowerCase().trim();

    if (search) {
      result = result.filter(book =>
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search) ||
        (book.isbn || '').toLowerCase().includes(search)
      );
    }

    if (this.selectedCategory !== 'all') {
      result = result.filter(book => book.category === this.selectedCategory);
    }

    if (this.statusFilter === 'active') {
      result = result.filter(book => book.isActive !== false);
    }

    if (this.statusFilter === 'inactive') {
      result = result.filter(book => book.isActive === false);
    }

    result = [...result].sort((a, b) => {
      switch (this.sortBy) {
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'author-asc':
          return a.author.localeCompare(b.author);
        case 'stock-low':
          return a.stock - b.stock;
        case 'stock-high':
          return b.stock - a.stock;
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return result;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedCategory = 'all';
    this.statusFilter = 'all';
    this.sortBy = 'title-asc';
  }

  editBook(book: Book): void {
    this.editingBook = { ...book };
    this.message = '';
    this.error = '';
  }

  cancelEdit(): void {
    this.editingBook = null;
  }

  updateBook(): void {
    if (!this.editingBook?.id) return;

    this.bookService.updateBook(this.editingBook.id, this.editingBook).subscribe({
      next: () => {
        this.message = 'Book updated successfully.';
        this.error = '';
        this.editingBook = null;
        this.loadBooks();
      },
      error: () => {
        this.error = 'Failed to update book.';
        this.message = '';
      }
    });
  }

  deleteBook(book: Book): void {
    if (!book.id) return;

    const confirmed = confirm(`Delete "${book.title}"?`);

    if (!confirmed) return;

    this.bookService.deleteBook(book.id).subscribe({
      next: () => {
        this.message = 'Book deleted successfully.';
        this.error = '';
        this.loadBooks();
      },
      error: () => {
        this.error = 'Failed to delete book.';
        this.message = '';
      }
    });
  }
}