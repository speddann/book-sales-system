# Setup Guide

This guide is setup-only. Follow the steps in order.

## 1. Prerequisites

Install:

- .NET 8 SDK
- Node.js (LTS) and npm
- SQL Server (local install or container)

Optional but recommended:

- Angular CLI

```powershell
npm install -g @angular/cli
```

## 2. Confirm Default Ports

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:5145`
- SQL Server: `localhost,1433`

## 3. Configure Database Connection

Open `backend/appsettings.json` and verify `DefaultConnection`:

```json
"DefaultConnection": "Server=localhost,1433;Database=BookSalesDB;User Id=sa;Password=YourStrong!Pass123;TrustServerCertificate=True"
```

If your SQL Server uses different host/user/password, update this value.

## 4. Install Backend Dependencies

From project root:

```powershell
cd backend
dotnet restore
```

## 5. Apply Database Migrations

Still in `backend`:

```powershell
dotnet ef database update
```

If `dotnet ef` is not installed:

```powershell
dotnet tool install --global dotnet-ef
dotnet ef database update
```

## 6. Run Backend API

In `backend`:

```powershell
dotnet run
```

Verify:

- Swagger: `http://localhost:5145/swagger`

## 7. Install Frontend Dependencies

Open a second terminal from project root:

```powershell
cd frontend
npm install
```

## 8. Run Frontend App

In `frontend`:

```powershell
npm start
```

Verify:

- App URL: `http://localhost:4200`

## 9. Quick Setup Verification

1. Open app and confirm books load.
2. Open New Sale and add a book.
3. Complete a sale and confirm receipt preview appears.
4. Open Orders and confirm sale is visible.

## 10. Helpful Commands

Backend build:

```powershell
cd backend
dotnet build
```

Frontend build:

```powershell
cd frontend
npx ng build --configuration development
```

## 11. Common Setup Issues

`SQL login failed`
- Check `DefaultConnection` in `backend/appsettings.json`.
- Ensure SQL Server is running on the configured host/port.

`Port already in use`
- Stop other processes on `4200` or `5145`, then restart.

`dotnet ef database update` fails
- Run it from `backend` folder.
- Ensure backend restore succeeded.

`npm start` fails
- Delete `frontend/node_modules` and reinstall:

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
npm start
```
