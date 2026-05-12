# Book Sales App

Full-stack bookstore management system built with Angular and .NET 8.

This project supports catalog management, customer management, sales checkout, inventory tracking, returns, analytics, and receipt workflows.

## Latest Updates (May 2026)

- Added `PaymentStatus` and `PaymentReference` end-to-end in sale flow
- Added receipt email API integration path with mock backend response
- Added payment status badges and payment-status filter in Orders
- Added click-based navbar dropdown behavior for Sales and Operations
- Enhanced Customers list with sorting, pagination, and results count

## What This Project Does

- Manage a full book catalog (price, stock, category, ISBN, status)
- Run point-of-sale checkout with customer or guest flow
- Track customers and customer order history
- Manage inventory and stock adjustments
- View sales insights in dashboard/report screens
- Generate receipt preview with print and email actions

## Tech Stack

- Frontend: Angular (standalone components), TypeScript, RxJS
- Backend: ASP.NET Core Web API (.NET 8), Entity Framework Core
- Database: SQL Server

## Project Structure

- [frontend](frontend): Angular application
- [backend](backend): .NET 8 Web API
- [PROJECT_SETUP.md](PROJECT_SETUP.md): detailed local setup guide
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md): full project documentation

## Main Features

### Shop

- Search by title/author/ISBN
- Category filter and sorting
- Pagination and result count
- Product-style cards with stock states and details
- Cart with quantity controls

### New Sale (POS)

- Search/select books and build sale cart
- Guest checkout or customer-based checkout
- Quick-add customer from sale screen
- Auto fee and final total calculation
- Payment status selection (Paid/Pending/Failed)
- Payment reference capture
- Receipt preview with item-level lines
- Print receipt and email receipt (mock backend endpoint)

### Customers

- Add, edit, delete, and search customers
- Customer list sorting (name/date)
- Customer list pagination + result count
- Customer summary (orders, spend, last purchase)
- Order history filters:
	- date range
	- sort (newest/oldest)
	- page size and pagination

### Orders

- Date-based filters and custom range
- Payment status badges (Paid/Pending/Failed)
- Payment status filter (client-side)
- Shows payment reference when present
- Return order workflow

### Manage Books

- Advanced filters (search/category/status/sort)
- Active vs inactive status controls
- Sectioned edit form for catalog fields

### Inventory and Dashboard

- Stock adjustments and inventory history
- Low stock visibility
- Dashboard metrics and top-books reporting

## API Highlights

Base URLs:
- Books: `/api/books`
- Sales: `/api/sales`
- Customers: `/api/customers`

Key endpoints include:
- `POST /api/sales`
- `POST /api/sales/{id}/return`
- `POST /api/sales/{saleId}/return-items`
- `POST /api/sales/{id}/email-receipt` (mock success response)
- `GET /api/customers?search=...`
- `GET /api/customers/{id}/summary`
- `POST /api/books/{id}/stock-adjustment`

Sale payload now supports:
- `paymentMethod`
- `paymentStatus`
- `paymentReference`

## Quick Start

### Prerequisites

- Node.js + npm
- .NET 8 SDK
- SQL Server (local or container)

### Default Ports

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:5145`

### 1. Run Backend

Open terminal in [backend](backend):

```powershell
dotnet restore
dotnet run
```

Swagger:

- `http://localhost:5145/swagger`

### 2. Run Frontend

Open second terminal in [frontend](frontend):

```powershell
npm install
npm start
```

App URL:

- `http://localhost:4200`

## Build Commands

Backend build:

```powershell
dotnet build
```

Apply migrations:

```powershell
dotnet ef database update
```

Frontend build:

```powershell
npx ng build --configuration development
```

## Current Notes

- Email receipt endpoint is currently mock-only (no SMTP provider wired yet)
- This is ideal for learning flow first, then real email integration next
- Payment status default is configured as `Paid`

## Documentation

For complete details, see:

- [PROJECT_SETUP.md](PROJECT_SETUP.md)
- [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)
