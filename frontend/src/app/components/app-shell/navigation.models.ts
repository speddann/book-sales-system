export type AppView =
  | 'shop'
  | 'new-sale'
  | 'orders'
  | 'returns'
  | 'receipt'
  | 'inventory'
  | 'stock-history'
  | 'bulk-import'
  | 'dashboard'
  | 'add-book'
  | 'manage-books'
  | 'categories'
  | 'customers'
  | 'reports'
  | 'home-features'
  | 'users'
  | 'settings'
  | 'help';

export interface NavigationItem {
  label: string;
  icon: string;
  view: AppView;
  placeholder?: boolean;
}

export interface NavigationGroup {
  id: string;
  label: string;
  icon: string;
  items: NavigationItem[];
}

export const VIEW_LABELS: Record<AppView, string> = {
  shop: 'Shop',
  'new-sale': 'New Sale',
  orders: 'Orders',
  returns: 'Returns',
  receipt: 'Receipt',
  inventory: 'Inventory',
  'stock-history': 'Stock History',
  'bulk-import': 'Bulk Import',
  dashboard: 'Dashboard',
  'add-book': 'Add Book',
  'manage-books': 'Manage Books',
  categories: 'Categories',
  customers: 'Customers',
  reports: 'Reports',
  'home-features': 'Home Features',
  users: 'Users',
  settings: 'Settings',
  help: 'Help'
};

export const VIEW_PARENTS: Partial<Record<AppView, string>> = {
  'new-sale': 'Sales',
  orders: 'Sales',
  returns: 'Sales',
  'add-book': 'Catalog',
  'manage-books': 'Catalog',
  categories: 'Catalog',
  'home-features': 'Catalog',
  inventory: 'Inventory',
  'stock-history': 'Inventory',
  'bulk-import': 'Inventory',
  customers: 'Customers',
  reports: 'Reports',
  users: 'Administration',
  settings: 'Administration',
  shop: 'Shop',
  receipt: 'Sales'
};

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    id: 'sales',
    label: 'Sales',
    icon: '$',
    items: [
      { label: 'New Sale', icon: '+', view: 'new-sale' },
      { label: 'Orders', icon: '#', view: 'orders' },
      { label: 'Returns', icon: 'R', view: 'returns', placeholder: true }
    ]
  },
  {
    id: 'catalog',
    label: 'Catalog',
    icon: 'B',
    items: [
      { label: 'Add Book', icon: '+', view: 'add-book' },
      { label: 'Manage Books', icon: 'M', view: 'manage-books' },
      { label: 'Categories', icon: 'C', view: 'categories', placeholder: true },
      { label: 'Home Features', icon: 'H', view: 'home-features' }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'I',
    items: [
      { label: 'Inventory', icon: 'I', view: 'inventory' },
      { label: 'Stock History', icon: 'S', view: 'stock-history', placeholder: true },
      { label: 'Bulk Import', icon: 'U', view: 'bulk-import', placeholder: true }
    ]
  },
  {
    id: 'administration',
    label: 'Administration',
    icon: 'A',
    items: [
      { label: 'Users', icon: 'U', view: 'users', placeholder: true },
      { label: 'Settings', icon: 'S', view: 'settings', placeholder: true }
    ]
  }
];
