# Mac Setup Guide + Database Dump Transfer

This guide helps you run the project on a Mac and move your existing database into it.

## 1. Prerequisites on macOS

Install these tools first:

- Homebrew
- .NET 8 SDK
- Node.js LTS + npm
- Docker Desktop (recommended for SQL Server on Mac)

Commands:

```bash
# 1) Install Homebrew (if missing)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2) Install .NET 8
brew install --cask dotnet-sdk

# 3) Install Node.js LTS
brew install node

# 4) Install Docker Desktop
brew install --cask docker
```

Optional (useful for querying SQL Server from Mac):

```bash
brew install --cask azure-data-studio
```

## 2. Start SQL Server in Docker (Mac-friendly)

SQL Server does not run natively as a normal Mac service for this setup, so run it in Docker:

```bash
docker run -e "ACCEPT_EULA=Y" \
	-e "MSSQL_SA_PASSWORD=YourStrong!Pass123" \
	-p 1433:1433 \
	--name booksales-sql \
	-d mcr.microsoft.com/mssql/server:2022-latest
```

Check container status:

```bash
docker ps
```

## 3. Configure Backend Connection String

Open `backend/appsettings.json` and verify:

```json
"DefaultConnection": "Server=localhost,1433;Database=BookSalesDB;User Id=sa;Password=YourStrong!Pass123;TrustServerCertificate=True"
```

If you use a different SQL password, update it here.

## 4. Backend Setup (API)

From project root:

```bash
cd backend
dotnet restore
```

Install EF CLI if needed:

```bash
dotnet tool install --global dotnet-ef
```

Apply migrations:

```bash
dotnet ef database update
```

Run API:

```bash
dotnet run
```

Verify Swagger:

- http://localhost:5145/swagger

## 5. Frontend Setup (Angular)

Open a second terminal from project root:

```bash
cd frontend
npm install
npm start
```

Verify app:

- http://localhost:4200

## 6. Transfer Your Database Dump to Mac

You can transfer either:

- `.sql` dump (script file)
- `.bak` dump (SQL Server backup)

Copy your dump file from old machine to Mac (AirDrop, USB, Drive, SCP, etc.).

Example target location:

```bash
mkdir -p ~/db-dumps
```

## 7A. Restore from .sql Dump (Recommended)

If your dump is a SQL script, run it inside the SQL container.

1) Copy dump file into container:

```bash
docker cp ~/db-dumps/your_dump.sql booksales-sql:/tmp/your_dump.sql
```

2) Execute the script:

```bash
docker exec -it booksales-sql /opt/mssql-tools18/bin/sqlcmd \
	-S localhost -U sa -P 'YourStrong!Pass123' -C \
	-i /tmp/your_dump.sql
```

If the script does not create `BookSalesDB`, create it first:

```bash
docker exec -it booksales-sql /opt/mssql-tools18/bin/sqlcmd \
	-S localhost -U sa -P 'YourStrong!Pass123' -C \
	-Q "IF DB_ID('BookSalesDB') IS NULL CREATE DATABASE BookSalesDB"
```

## 7B. Restore from .bak Dump

1) Copy backup into container:

```bash
docker cp ~/db-dumps/your_backup.bak booksales-sql:/var/opt/mssql/backup/your_backup.bak
```

2) Inspect logical file names in the backup:

```bash
docker exec -it booksales-sql /opt/mssql-tools18/bin/sqlcmd \
	-S localhost -U sa -P 'YourStrong!Pass123' -C \
	-Q "RESTORE FILELISTONLY FROM DISK = '/var/opt/mssql/backup/your_backup.bak'"
```

3) Restore as `BookSalesDB` (replace logical names with your actual names):

```bash
docker exec -it booksales-sql /opt/mssql-tools18/bin/sqlcmd \
	-S localhost -U sa -P 'YourStrong!Pass123' -C \
	-Q "RESTORE DATABASE BookSalesDB \
			FROM DISK = '/var/opt/mssql/backup/your_backup.bak' \
			WITH MOVE 'YourLogicalDataName' TO '/var/opt/mssql/data/BookSalesDB.mdf', \
					 MOVE 'YourLogicalLogName'  TO '/var/opt/mssql/data/BookSalesDB_log.ldf', \
					 REPLACE"
```

## 8. Verify Data Is Restored

Quick row check:

```bash
docker exec -it booksales-sql /opt/mssql-tools18/bin/sqlcmd \
	-S localhost -U sa -P 'YourStrong!Pass123' -C \
	-d BookSalesDB \
	-Q "SELECT COUNT(*) AS BooksCount FROM Books"
```

If this returns a number, your data is available to the API.

## 9. Run App with Restored Data

1. Start backend (`dotnet run` in `backend`)
2. Start frontend (`npm start` in `frontend`)
3. Open app and verify existing books/customers/orders are visible

## 10. Common Issues on Mac

`Cannot connect to SQL Server`

- Check container is running: `docker ps`
- Check SQL logs: `docker logs booksales-sql`
- Confirm connection string in `backend/appsettings.json`

`Login failed for user sa`

- Password in appsettings must match container password
- If needed, recreate container with a known password

`dotnet ef database update` fails after restoring dump

- If dump already contains schema/data, you may not need EF update
- Run migrations only when target DB is empty or migration-aligned

`npm start` fails

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## 11. One-Click Run in VS Code

This project now includes workspace-level VS Code run config files:

- `.vscode/tasks.json`
- `.vscode/launch.json`

How to use:

1. Open project root in VS Code.
2. Click Run and Debug.
3. Select `Run Full Stack`.
4. Click the Run button.

What this does:

- Starts backend (`dotnet run` from `backend`)
- Starts frontend (`npm start` from `frontend`)
- Opens browser at `http://localhost:4200`

Note:

- First run may take longer while dependencies build.
- When you stop debugging, terminals may still be running. Stop them from the Terminal panel if needed.
