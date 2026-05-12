# Book Sales App - Project Documentation

## 1. Project Overview

Book Sales App is a full-stack application for managing a bookstore workflow from catalog management to sales checkout and customer history.

Mental model:
- Frontend (Angular) = Brain/UI layer
- Backend (.NET 8 API) = Business rules and operations
- Database (SQL Server) = Source of truth

Primary goals:
- Manage books and stock
- Perform sales with customer selection or guest checkout
- Track customers and purchase history
- View operational insights through dashboard and reports

## 2. Tech Stack

Frontend:
- Angular (standalone components)
- TypeScript
- RxJS
- CSS

Backend:
- ASP.NET Core Web API (.NET 8)
- Entity Framework Core
- SQL Server

Infrastructure:
- CORS configured for Angular localhost
- Swagger enabled for API exploration

## 3. High-Level Architecture

Request flow:
1. UI component calls BookService
2. BookService calls backend API endpoints
3. Controller delegates to service/data layer
4. EF Core reads/writes SQL Server
5. Response returns to frontend and updates UI state

Backend structure:
- Controllers: API endpoint layer
- Services: domain/business logic
- Data/AppDbContext: EF Core data access
- Models/DTOs: domain entities and transfer shapes
- Middleware: centralized exception handling

Frontend structure:
- app.ts + app.html: view switching and navigation
- components/: feature screens
- services/book.ts: HTTP and client-side shared state

## 4. Current Frontend Features

### 4.1 Navigation and Views

Operations available from navigation:
- Shop
- New Sale
- Orders
- Receipt
- Inventory
- Dashboard
- Add Book
- Manage Books
- Customers

### 4.2 Shop (Customer-facing browsing)

Implemented:
- Search by title/author/ISBN
- Category filter
- Sorting (title/author/price/stock)
- Pagination and result counts
- Empty-state with clear filters
- Book cards with category, ISBN, short description
- Stock badge states: In Stock / Low Stock / Out of Stock
- Book detail modal with richer metadata
- Cart panel with quantity controls

### 4.3 New Sale (POS workflow)

Implemented:
- Search and add books to current sale
- Quantity increase/decrease and remove item
- Payment method with fee calculation
- Customer options:
  - Guest checkout
  - Search existing customer
  - Quick-add new customer without leaving sale screen
- Customer summary preview when selected
- Sale completion with stock updates

Receipt enhancements implemented in New Sale:
- Receipt Preview card after successful sale
- Shows customer name or Guest
- Line item table:
  - Book title
  - Quantity
  - Price per item
  - Line total
- Subtotal, fee, and final total
- Print Receipt action
- Email Receipt action with input box and status messages

### 4.4 Orders and Receipt

Implemented:
- Orders view for saved sales
- Dedicated Receipt view reading last completed sale data

### 4.5 Inventory

Implemented:
- Inventory listing
- Search by title/author
- Stock adjustment workflow
- Inventory history filtering
- Low stock visibility

### 4.6 Add Book

Implemented:
- Structured form sections:
  - Basic Information
  - Pricing and Inventory
  - Book Details
- Category dropdown
- Active/inactive status toggle
- Validation and submit feedback

### 4.7 Manage Books

Implemented:
- Book listing with status badges
- Inactive row styling
- Advanced toolbar filters:
  - Search by title/author/ISBN
  - Category filter
  - Status filter (all/active/inactive)
  - Sorting options
  - Clear filters
- Sectioned edit form matching Add Book layout

### 4.8 Customers

Implemented:
- Add customer
- Edit/delete customer
- Search by name/phone/email
- Customer summary panel
- Order history tools:
  - Date range filter
  - Sort oldest/newest
  - Page size selector
  - Pagination controls
  - Result count and empty state

### 4.9 Dashboard

Implemented:
- Sales and revenue indicators
- Top-book style reporting from backend data

## 5. Current Backend Features and API Endpoints

### 5.1 Books API

Base: `/api/books`

Endpoints:
- `GET /api/books`
- `GET /api/books/{id}`
- `POST /api/books`
- `PUT /api/books/{id}`
- `DELETE /api/books/{id}`
- `POST /api/books/{id}/stock-adjustment`
- `GET /api/books/inventory-history`

### 5.2 Sales API

Base: `/api/sales`

Endpoints:
- `POST /api/sales` (create sale)
- `GET /api/sales` (sales query)
- `GET /api/sales/report`
- `GET /api/sales/top-books`
- `GET /api/sales/dashboard`
- `POST /api/sales/{id}/return`
- `POST /api/sales/{saleId}/return-items`
- `POST /api/sales/{id}/email-receipt` (mock success response)

### 5.3 Customers API

Base: `/api/customers`

Endpoints:
- `GET /api/customers?search=...`
- `POST /api/customers`
- `PUT /api/customers/{id}`
- `DELETE /api/customers/{id}`
- `GET /api/customers/{id}/summary`

## 6. Core Data and Business Rules

Book domain includes:
- Title, Author, Category, ISBN, Description, ImageUrl
- Price, CostPrice, Stock
- IsActive

Key business rules currently enforced:
- Inactive books cannot be sold
- Stock constraints prevent overselling in UI flow
- Customer name required when creating a customer
- Sale return endpoints available

## 7. Local Run and Verification

### 7.1 Default Ports

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:5145`

### 7.2 Run Commands

Backend:
- `dotnet restore`
- `dotnet run`

Frontend:
- `npm install`
- `npm start`

Build checks:
- Frontend: `npx ng build --configuration development`
- Backend: `dotnet build`

### 7.3 Quick Functional Smoke Test

1. Open Shop and verify books load.
2. Filter and paginate shop results.
3. Create a sale in New Sale with customer/guest.
4. Confirm receipt preview shows full itemized details.
5. Print receipt and test email receipt (mock endpoint).
6. Open Customers and verify history filter/paging.
7. Open Manage Books and verify admin filters/edit.

## 8. Current Limitations and Next Steps

Current limitations:
- Email receipt endpoint is mock-only (no real SMTP provider)
- Some response shapes differ between screens and can be standardized further
- Automated test coverage is minimal

Recommended next steps:
1. Add real SMTP provider integration (Gmail/SendGrid/SMTP)
2. Standardize API response contracts across all endpoints
3. Add unit/integration tests for critical flows
4. Add authentication/authorization for admin operations
5. Convert this doc into a polished README + API reference split

## 9. Suggested Documentation Split (Later)

When ready, split into:
- README.md (quick start + core features)
- docs/API.md (endpoint reference)
- docs/ARCHITECTURE.md (design and flow)
- docs/ROADMAP.md (planned improvements)
