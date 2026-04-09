# Project Setup

This document explains how to run the Book Sales application locally.

## Mental Model

- Frontend (Angular) = UI layer
- Backend (.NET 8 API) = business logic and API layer
- SQL Server = source of truth for books and sales data

## Project Structure

- `frontend/` Angular application
- `backend/` ASP.NET Core Web API

## Tech Stack

- Angular 21
- .NET 8 Web API
- Entity Framework Core 8
- SQL Server

## Default Ports

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:5145`
- SQL Server: `localhost,1433`

## Prerequisites

Install these before starting:

- Node.js and npm
- Angular CLI
- .NET 8 SDK
- SQL Server running locally or in Docker

Optional Angular CLI install:

```powershell
npm install -g @angular/cli
```

## Database Configuration

The backend uses this connection string from `backend/appsettings.json`:

```json
"DefaultConnection": "Server=localhost,1433;Database=BookSalesDB;User Id=sa;Password=YourStrong!Pass123;TrustServerCertificate=True"
```

Make sure your SQL Server instance is running with these values, or update the connection string to match your environment.

## Database Setup Without Docker

If you do not want to use Docker, run SQL Server directly on your machine.

Recommended local setup:

- Install SQL Server Developer Edition or SQL Server Express
- Install SQL Server Management Studio or Azure Data Studio for GUI access
- Enable SQL authentication
- Create or reuse a login that matches the connection string

Expected values for this project:

- Server: `localhost,1433`
- Database: `BookSalesDB`
- User: `sa`
- Password: `YourStrong!Pass123`

If your local SQL Server uses different values, update `backend/appsettings.json` to match your environment.

## Using Workbench Instead of Docker

Important note:

- This project currently uses SQL Server, not MySQL
- MySQL Workbench is a GUI for MySQL databases
- Because of that, MySQL Workbench is not a direct replacement for the current setup

That means there are two different cases:

### Case 1: You want a GUI tool instead of Docker

Use one of these with SQL Server:

- SQL Server Management Studio
- Azure Data Studio

In this case, no code changes are needed. You only need a local SQL Server instance and the correct connection string.

### Case 2: You want to use MySQL Workbench

Then this project would need backend changes because the current code is built for SQL Server.

That would require:

- changing the EF Core provider from SQL Server to MySQL
- updating connection strings
- installing the MySQL EF Core package
- validating migrations and schema behavior

So for the current codebase, the safer path is:

- keep SQL Server as the database
- use SQL Server Management Studio or Azure Data Studio as the GUI tool

## Suggested Local SQL Server Workflow

1. Install SQL Server locally.
2. Open SQL Server Management Studio or Azure Data Studio.
3. Connect to `localhost,1433`.
4. Make sure the login in `appsettings.json` exists.
5. Start the backend with `dotnet run`.
6. Let EF Core connect and create/use the database.
7. Start the frontend with `npm start`.

## Run the Backend

Open a terminal in `backend/` and run:

```powershell
dotnet restore
dotnet run
```

Notes:

- The API is configured to listen on `http://0.0.0.0:5145`
- Swagger should be available at `http://localhost:5145/swagger`

## Run the Frontend

Open a second terminal in `frontend/` and run:

```powershell
npm install
npm start
```

Then open:

```text
http://localhost:4200
```

## How Frontend and Backend Connect

- Angular sends HTTP requests to the backend
- The backend reads and writes data through Entity Framework Core
- SQL Server stores books, stock, and sales history

## Current Important Behavior

- Cart data is stored in browser localStorage
- Stock validation happens before increasing item quantity in the cart
- Sales history is fetched from the backend sales API

## Basic Verification Checklist

Use this checklist after startup:

1. Open the frontend and confirm books load.
2. Add a book to cart and increase quantity.
3. Try increasing beyond stock and confirm it is blocked.
4. Checkout and confirm the order is saved.
5. Open order history and confirm the sale appears.

## Helpful Commands

Backend build:

```powershell
dotnet build
```

Frontend build:

```powershell
npm run build
```

Frontend tests:

```powershell
npm test
```
