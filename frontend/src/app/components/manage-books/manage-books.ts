import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookService, BookAdminDto } from '../../services/book';

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

  books = signal<BookAdminDto[]>([]);
  editingBook: BookAdminDto | null = null;
  searchText = '';
  selectedCategory = 'all';
  statusFilter = 'all';
  sortBy = 'title-asc';
  message = '';
  error = '';

  constructor(public bookService: BookService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.bookService.getAdminBooks().subscribe(data => {
      this.books.set(data);
    });
  }

  get filteredBooks(): BookAdminDto[] {
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

    if (this.statusFilter !== 'all') {
      result = result.filter(book => this.getBookStatus(book) === this.statusFilter);
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

  editBook(book: BookAdminDto): void {
    this.editingBook = {
      ...book,
      sellingPrice: this.bookService.getSellingPrice(book),
      coverImageUrl: this.bookService.getCoverImageUrl(book),
      shortDescription: this.bookService.getShortDescription(book),
      status: this.getBookStatus(book)
    };
    this.message = '';
    this.error = '';
  }

  cancelEdit(): void {
    this.editingBook = null;
  }

  updateBook(): void {
    if (!this.editingBook?.id) return;

    if (!this.editingBook.title.trim()) {
      this.error = 'Book title is required.';
      return;
    }

    if ((this.editingBook.sellingPrice ?? 0) < 0) {
      this.error = 'Selling price cannot be negative.';
      return;
    }

    if ((this.editingBook.costPrice ?? 0) < 0) {
      this.error = 'Cost price cannot be negative.';
      return;
    }

    if (this.editingBook.stock < 0) {
      this.error = 'Stock cannot be negative.';
      return;
    }

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

  deleteBook(book: BookAdminDto): void {
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

  getBookStatus(book: BookAdminDto): string {
    return book.status ?? (book.isActive === false ? 'Inactive' : 'Active');
  }
}
