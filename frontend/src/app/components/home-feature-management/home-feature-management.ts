import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookAdminDto, BookService } from '../../services/book';
import {
  HomeFeatureStatus,
  HomeSectionCardComponent,
  HomeSectionConfig
} from './widgets/home-section-card';
import { SelectedBookRowComponent } from './widgets/selected-book-row';
import { HomePromotion, PromotionCardComponent } from './widgets/promotion-card';

interface HomeFeatureState {
  sections: HomeSectionConfig[];
  featuredBookIds: number[];
  promotions: HomePromotion[];
  activePromotionId: string;
}

@Component({
  selector: 'app-home-feature-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HomeSectionCardComponent,
    SelectedBookRowComponent,
    PromotionCardComponent
  ],
  templateUrl: './home-feature-management.html',
  styleUrl: './home-feature-management.css'
})
export class HomeFeatureManagementComponent implements OnInit {
  private readonly storageKey = 'bookSalesHomeFeatureSettings';

  books = signal<BookAdminDto[]>([]);
  state = signal<HomeFeatureState>(this.defaultState());
  savedSnapshot = '';
  searchText = '';
  message = '';
  previewFocused = false;

  readonly maximumFeaturedBooks = 8;

  readonly futureSections = [
    { title: 'Customer Reviews', detail: 'Feature testimonials on the customer homepage.' },
    { title: 'Upcoming Events', detail: 'Promote launches, readings, and local store events.' },
    { title: 'Video Banner', detail: 'Add a rich media hero area later.' },
    { title: 'Announcements', detail: 'Publish urgent store updates and seasonal notices.' },
    { title: 'Newsletter Signup', detail: 'Capture customer emails when marketing is ready.' }
  ];

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadState();
    this.loadBooks();
  }

  loadState(): void {
    const saved = localStorage.getItem(this.storageKey);
    const parsed = saved ? JSON.parse(saved) as HomeFeatureState : this.defaultState();
    this.state.set(parsed);
    this.savedSnapshot = JSON.stringify(parsed);
  }

  saveChanges(): void {
    const serialized = JSON.stringify(this.state());
    localStorage.setItem(this.storageKey, serialized);
    this.savedSnapshot = serialized;
    this.message = 'Home feature settings saved locally.';
  }

  discardChanges(): void {
    const restored = this.savedSnapshot
      ? JSON.parse(this.savedSnapshot) as HomeFeatureState
      : this.defaultState();

    this.state.set(restored);
    this.message = 'Unsaved changes discarded.';
  }

  previewCustomerHome(): void {
    this.previewFocused = true;
    this.message = 'Customer home preview refreshed.';
  }

  markDirty(): void {
    this.message = '';
  }

  loadBooks(): void {
    this.bookService.getAdminBooks().subscribe({
      next: (books) => this.books.set(books.length ? books : this.mockBooks()),
      error: () => this.books.set(this.mockBooks())
    });
  }

  get hasUnsavedChanges(): boolean {
    return JSON.stringify(this.state()) !== this.savedSnapshot;
  }

  get filteredBooks(): BookAdminDto[] {
    const search = this.searchText.toLowerCase().trim();
    const selected = new Set(this.state().featuredBookIds);

    return this.books()
      .filter(book => !selected.has(book.id ?? 0))
      .filter(book => {
        if (!search) return true;
        return book.title.toLowerCase().includes(search) ||
          book.author.toLowerCase().includes(search) ||
          (book.category || '').toLowerCase().includes(search) ||
          (book.isbn || '').toLowerCase().includes(search);
      })
      .slice(0, 8);
  }

  get selectedFeaturedBooks(): BookAdminDto[] {
    const byId = new Map(this.books().map(book => [book.id, book]));

    return this.state().featuredBookIds
      .map(id => byId.get(id))
      .filter((book): book is BookAdminDto => Boolean(book));
  }

  get activePromotion(): HomePromotion {
    const currentState = this.state();
    return currentState.promotions.find(promotion => promotion.id === currentState.activePromotionId)
      ?? currentState.promotions[0];
  }

  get previewPromotion(): HomePromotion {
    return this.state().promotions.find(promotion => promotion.status === 'Active')
      ?? this.activePromotion;
  }

  get topSellersPreview(): BookAdminDto[] {
    return this.books().slice(0, 4);
  }

  get newArrivalsPreview(): BookAdminDto[] {
    return [...this.books()].slice(-4).reverse();
  }

  get staffPicksPreview(): BookAdminDto[] {
    return this.selectedFeaturedBooks.slice(0, 3);
  }

  addFeaturedBook(book: BookAdminDto): void {
    if (!book.id || this.state().featuredBookIds.length >= this.maximumFeaturedBooks) return;

    this.updateState({
      ...this.state(),
      featuredBookIds: [...this.state().featuredBookIds, book.id]
    });
  }

  removeFeaturedBook(bookId: number | undefined): void {
    if (!bookId) return;

    this.updateState({
      ...this.state(),
      featuredBookIds: this.state().featuredBookIds.filter(id => id !== bookId)
    });
  }

  moveFeaturedBook(index: number, direction: -1 | 1): void {
    const ids = [...this.state().featuredBookIds];
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= ids.length) return;

    [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
    this.updateState({ ...this.state(), featuredBookIds: ids });
  }

  createPromotion(): void {
    const promotion: HomePromotion = {
      id: `promotion-${Date.now()}`,
      name: 'New Promotion',
      bannerTitle: 'Seasonal Reading Picks',
      bannerSubtitle: 'Curated books for your next shelf refresh.',
      bannerImageUrl: '',
      buttonText: 'Shop Now',
      buttonLink: '/featured',
      startDate: '',
      endDate: '',
      status: 'Draft',
      bookIds: []
    };

    this.updateState({
      ...this.state(),
      promotions: [promotion, ...this.state().promotions],
      activePromotionId: promotion.id
    });
  }

  editPromotion(id: string): void {
    this.updateState({ ...this.state(), activePromotionId: id });
  }

  duplicatePromotion(id: string): void {
    const promotion = this.state().promotions.find(item => item.id === id);
    if (!promotion) return;

    const copy = {
      ...promotion,
      id: `promotion-${Date.now()}`,
      name: `${promotion.name} Copy`,
      status: 'Draft' as HomeFeatureStatus
    };

    this.updateState({
      ...this.state(),
      promotions: [copy, ...this.state().promotions],
      activePromotionId: copy.id
    });
  }

  archivePromotion(id: string): void {
    this.updatePromotion(id, { status: 'Archived' });
  }

  updateActivePromotion(field: keyof HomePromotion, value: string): void {
    this.updatePromotion(this.activePromotion.id, { [field]: value } as Partial<HomePromotion>);
  }

  togglePromotionBook(bookId: number | undefined): void {
    if (!bookId) return;

    const promotion = this.activePromotion;
    const exists = promotion.bookIds.includes(bookId);
    const bookIds = exists
      ? promotion.bookIds.filter(id => id !== bookId)
      : [...promotion.bookIds, bookId];

    this.updatePromotion(promotion.id, { bookIds });
  }

  editSection(sectionId: string): void {
    if (sectionId === 'featured-book') {
      this.searchText = '';
    }

    this.message = `Editing ${this.state().sections.find(section => section.id === sectionId)?.name ?? 'section'}.`;
  }

  getBookInitial(title: string): string {
    return (title || 'B').slice(0, 1).toUpperCase();
  }

  getBookPrice(book: BookAdminDto): number {
    return book.sellingPrice ?? book.price ?? 0;
  }

  isPromotionBookSelected(bookId: number | undefined): boolean {
    return Boolean(bookId && this.activePromotion.bookIds.includes(bookId));
  }

  private updatePromotion(id: string, patch: Partial<HomePromotion>): void {
    this.updateState({
      ...this.state(),
      promotions: this.state().promotions.map(promotion =>
        promotion.id === id ? { ...promotion, ...patch } : promotion
      )
    });
  }

  private updateState(nextState: HomeFeatureState): void {
    this.state.set(nextState);
    this.markDirty();
  }

  private defaultState(): HomeFeatureState {
    return {
      sections: [
        {
          id: 'featured-book',
          name: 'Featured Book',
          description: 'Primary customer-facing book spotlight.',
          visible: true,
          mode: 'Manual',
          status: 'Active'
        },
        {
          id: 'book-of-month',
          name: 'Book of the Month',
          description: 'Monthly editorial or owner-selected feature.',
          visible: true,
          mode: 'Manual',
          status: 'Scheduled'
        },
        {
          id: 'top-selling-books',
          name: 'Top Selling Books',
          description: 'Show bestselling books from sales activity.',
          visible: true,
          mode: 'Automatic',
          status: 'Active'
        },
        {
          id: 'new-arrivals',
          name: 'New Arrivals',
          description: 'Highlight fresh catalog additions.',
          visible: true,
          mode: 'Automatic',
          status: 'Active'
        },
        {
          id: 'staff-picks',
          name: 'Staff Picks',
          description: 'Curated recommendations from the store team.',
          visible: true,
          mode: 'Manual',
          status: 'Draft'
        },
        {
          id: 'promotion-banner',
          name: 'Promotion Banner',
          description: 'Hero offer or campaign banner.',
          visible: true,
          mode: 'Manual',
          status: 'Active'
        },
        {
          id: 'festival-banner',
          name: 'Festival Banner',
          description: 'Seasonal, holiday, or festival campaign slot.',
          visible: false,
          mode: 'Manual',
          status: 'Hidden'
        },
        {
          id: 'category-highlights',
          name: 'Category Highlights',
          description: 'Featured categories for quick discovery.',
          visible: true,
          mode: 'Manual',
          status: 'Draft'
        },
        {
          id: 'recommended-for-you',
          name: 'Recommended For You',
          description: 'Future personalized recommendations area.',
          visible: false,
          mode: 'Automatic',
          status: 'Hidden'
        }
      ],
      featuredBookIds: [1, 2, 3],
      activePromotionId: 'promotion-summer',
      promotions: [
        {
          id: 'promotion-summer',
          name: 'Summer Reads',
          bannerTitle: 'Build Your Summer Reading Stack',
          bannerSubtitle: 'Fresh picks for slow mornings, travel days, and weekend resets.',
          bannerImageUrl: '',
          buttonText: 'Explore Picks',
          buttonLink: '/collections/summer',
          startDate: '2026-07-01',
          endDate: '2026-07-31',
          status: 'Active',
          bookIds: [1, 2]
        },
        {
          id: 'promotion-festival',
          name: 'Festival Offer',
          bannerTitle: 'Festival Favorites',
          bannerSubtitle: 'A seasonal collection ready for gifting.',
          bannerImageUrl: '',
          buttonText: 'View Collection',
          buttonLink: '/collections/festival',
          startDate: '2026-08-01',
          endDate: '2026-08-15',
          status: 'Scheduled',
          bookIds: [3]
        }
      ]
    };
  }

  private mockBooks(): BookAdminDto[] {
    return [
      { id: 1, title: 'Atomic Habits', author: 'James Clear', category: 'Self Help', isbn: '9780735211292', stock: 12, sellingPrice: 24.99, status: 'Active' },
      { id: 2, title: 'Deep Work', author: 'Cal Newport', category: 'Productivity', isbn: '9781455586691', stock: 8, sellingPrice: 22.5, status: 'Active' },
      { id: 3, title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', isbn: '9780061122415', stock: 15, sellingPrice: 18.99, status: 'Active' },
      { id: 4, title: 'Ikigai', author: 'Hector Garcia', category: 'Lifestyle', isbn: '9780143130727', stock: 6, sellingPrice: 19.99, status: 'Active' },
      { id: 5, title: 'The Power of Now', author: 'Eckhart Tolle', category: 'Spirituality', isbn: '9781577314806', stock: 4, sellingPrice: 21.99, status: 'Active' }
    ];
  }
}
